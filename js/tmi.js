(function(G){
function Client(o){
    o=o||{};
    this._ch=(o.channels||[]).map(c=>c.toLowerCase().replace('#',''));
    this._h={};
    this._ws=null;
    this._closed=false;
    this._connecting=false;
    this._reconnectAttempts=0;
    this._reconnectTimer=null;
    this._keepaliveTimer=null;
    this._watchdogTimer=null;
    this._lastActivity=0;
    this._status='idle';
    this._boundWake=null;
    this._boundOnline=null;
    this._boundOffline=null;
}
Client.STALE_MS=90000;
Client.KEEPALIVE_MS=25000;
Client.WATCHDOG_MS=15000;

Client.prototype.on=function(ev,fn){
    this._h[ev]=(this._h[ev]||[]).concat(fn);
    return this;
};
Client.prototype._emit=function(ev){
    var a=Array.prototype.slice.call(arguments,1);
    (this._h[ev]||[]).forEach(fn=>{try{fn.apply(null,a);}catch(e){console.error(e);}});
};
Client.prototype._setStatus=function(s,info){
    if(this._status===s)return;
    this._status=s;
    this._emit('status',s,info);
};
Client.prototype.status=function(){return this._status;};
Client.prototype.setChannels=function(list){
    this._ch=(list||[]).map(c=>c.toLowerCase().replace('#',''));
    if(this._ws&&this._ws.readyState===1){
        try{this._ch.forEach(ch=>this._ws.send('JOIN #'+ch));}catch(e){}
    }
};
Client.prototype.connect=function(){
    var self=this;
    self._closed=false;
    self._bindGlobalListeners();
    return new Promise((res,rej)=>{
        self._open(res,rej);
    });
};
Client.prototype._open=function(onOk,onErr){
    var self=this;
    if(self._closed)return;
    if(self._connecting||(self._ws&&(self._ws.readyState===0||self._ws.readyState===1)))return;
    self._connecting=true;
    self._setStatus('connecting',self._reconnectAttempts);
    var ws;
    try{ws=new WebSocket('wss://irc-ws.chat.twitch.tv:443');}
    catch(e){self._connecting=false;if(onErr)onErr(e);self._scheduleReconnect();return;}
    self._ws=ws;
    ws.onopen=function(){
        self._connecting=false;
        self._reconnectAttempts=0;
        self._lastActivity=Date.now();
        var r=Math.floor(Math.random()*9999999);
        try{
            ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
            ws.send('PASS oauth:justinfan'+r);
            ws.send('NICK justinfan'+r);
            self._ch.forEach(ch=>ws.send('JOIN #'+ch));
        }catch(e){}
        self._startKeepalive();
        self._startWatchdog();
        self._setStatus('connected');
        self._emit('connected');
        if(onOk)onOk();
    };
    ws.onerror=function(e){
        self._connecting=false;
        if(onErr&&self._reconnectAttempts===0){onErr(e);}
    };
    ws.onclose=function(){
        self._connecting=false;
        self._stopKeepalive();
        if(!self._closed){self._setStatus('connecting',self._reconnectAttempts+1);}
        self._emit('disconnected');
        if(!self._closed)self._scheduleReconnect();
    };
    ws.onmessage=function(e){self._lastActivity=Date.now();self._parse(e.data);};
};
Client.prototype._scheduleReconnect=function(){
    var self=this;
    if(self._closed)return;
    if(self._reconnectTimer)return;
    self._reconnectAttempts++;
    var delay=Math.min(15000,1000*Math.pow(1.6,Math.min(self._reconnectAttempts,8)));
    self._reconnectTimer=setTimeout(function(){
        self._reconnectTimer=null;
        if(self._closed)return;
        self._emit('reconnecting',self._reconnectAttempts);
        self._open();
    },delay);
};
Client.prototype._reconnectNow=function(){
    var self=this;
    if(self._closed)return;
    if(self._reconnectTimer){clearTimeout(self._reconnectTimer);self._reconnectTimer=null;}
    self._reconnectAttempts=0;
    var ws=self._ws;
    self._ws=null;
    if(ws){try{ws.onopen=ws.onclose=ws.onerror=ws.onmessage=null;ws.close();}catch(e){}}
    self._connecting=false;
    self._emit('reconnecting',0);
    self._open();
};
Client.prototype._startKeepalive=function(){
    var self=this;
    self._stopKeepalive();
    self._keepaliveTimer=setInterval(function(){
        if(self._ws&&self._ws.readyState===1){
            try{self._ws.send('PING :tmi.twitch.tv');}catch(e){}
        }
    },Client.KEEPALIVE_MS);
};
Client.prototype._stopKeepalive=function(){
    if(this._keepaliveTimer){clearInterval(this._keepaliveTimer);this._keepaliveTimer=null;}
};
Client.prototype._startWatchdog=function(){
    var self=this;
    if(self._watchdogTimer)return;
    self._watchdogTimer=setInterval(function(){
        if(self._closed)return;
        if(!self._ws||self._ws.readyState>1){self._scheduleReconnect();return;}
        if(self._ws.readyState===1&&self._lastActivity&&(Date.now()-self._lastActivity)>Client.STALE_MS){
            self._reconnectNow();
        }
    },Client.WATCHDOG_MS);
};
Client.prototype._isStale=function(){
    return !!(this._lastActivity&&(Date.now()-this._lastActivity)>Client.STALE_MS);
};
Client.prototype.wake=function(){
    if(this._closed)return;
    if(this._reconnectTimer){clearTimeout(this._reconnectTimer);this._reconnectTimer=null;this._reconnectAttempts=0;}
    if(!this._ws||this._ws.readyState>1){this._reconnectNow();return;}
    if(this._ws.readyState===0)return;
    if(this._isStale()){this._reconnectNow();return;}
    try{this._ws.send('PING :tmi.twitch.tv');}catch(e){this._reconnectNow();}
};
Client.prototype.forceCheck=function(){this.wake();};
Client.prototype._bindGlobalListeners=function(){
    if(this._boundWake||typeof window==='undefined')return;
    var self=this;
    this._boundWake=function(){if(typeof document==='undefined'||!document.hidden)self.wake();};
    this._boundOnline=function(){self._reconnectNow();};
    this._boundOffline=function(){self._setStatus('connecting',self._reconnectAttempts+1);};
    document.addEventListener('visibilitychange',this._boundWake);
    window.addEventListener('focus',this._boundWake);
    window.addEventListener('pageshow',this._boundWake);
    window.addEventListener('online',this._boundOnline);
    window.addEventListener('offline',this._boundOffline);
};
Client.prototype._unbindGlobalListeners=function(){
    if(!this._boundWake||typeof window==='undefined')return;
    document.removeEventListener('visibilitychange',this._boundWake);
    window.removeEventListener('focus',this._boundWake);
    window.removeEventListener('pageshow',this._boundWake);
    window.removeEventListener('online',this._boundOnline);
    window.removeEventListener('offline',this._boundOffline);
    this._boundWake=this._boundOnline=this._boundOffline=null;
};
Client.prototype.disconnect=function(){
    this._closed=true;
    this._setStatus('idle');
    this._stopKeepalive();
    if(this._watchdogTimer){clearInterval(this._watchdogTimer);this._watchdogTimer=null;}
    if(this._reconnectTimer){clearTimeout(this._reconnectTimer);this._reconnectTimer=null;}
    this._unbindGlobalListeners();
    if(this._ws){try{this._ws.close();}catch(e){}this._ws=null;}
};
Client.prototype._parseTags=function(str){
    var tags={badges:{}};
    str.split(';').forEach(p=>{var kv=p.split('=');tags[kv[0]]=kv[1]||'';});
    if(typeof tags['badges']==='string'){
        var b={};
        tags['badges'].split(',').forEach(bv=>{var p=bv.split('/');if(p[0])b[p[0]]=p[1]||'1';});
        tags['badges']=b;
    }
    tags['mod']=tags['mod']==='1';
    tags['subscriber']=tags['subscriber']==='1';
    tags['badges-raw']=tags['badges-raw']||'';
    return tags;
};
Client.prototype._parse=function(raw){
    var self=this;
    raw.split('\r\n').forEach(line=>{
        if(!line)return;
        if(line.indexOf('PING')===0){if(self._ws&&self._ws.readyState===1)self._ws.send('PONG :tmi.twitch.tv');return;}
        var tags={badges:{}},rest=line;
        if(line.charAt(0)==='@'){
            var sp=line.indexOf(' ');
            tags=self._parseTags(line.slice(1,sp));
            rest=line.slice(sp+1);
        }
        var pm=rest.indexOf(' PRIVMSG ');
        if(pm!==-1){
            var prefix=rest.slice(0,pm),afterCmd=rest.slice(pm+9),chanEnd=afterCmd.indexOf(' :');
            if(chanEnd!==-1){
                var channel=afterCmd.slice(0,chanEnd).replace('#',''),
                    message=afterCmd.slice(chanEnd+2),
                    username=prefix.slice(1,prefix.indexOf('!'));
                tags['username']=username;
                tags['display-name']=tags['display-name']||username;
                if(tags['bits']&&tags['bits']!=='')self._emit('cheer',channel,tags,message);
                self._emit('message',channel,tags,message,false);
            }
            return;
        }
        var un=rest.indexOf(':tmi.twitch.tv USERNOTICE ');
        if(un!==-1){
            var afterUN=rest.slice(un+26),unCE=afterUN.indexOf(' :'),
                ch2=afterUN.slice(0,unCE!==-1?unCE:afterUN.length).replace('#',''),
                mt=tags['msg-id'],
                dn=tags['display-name']||tags['login']||'?';
            if(mt==='sub')     self._emit('subscription',ch2,dn,{},tags);
            if(mt==='resub')   self._emit('resub',ch2,dn,parseInt(tags['msg-param-cumulative-months']||'1'),{},tags);
            if(mt==='subgift') self._emit('subgift',ch2,dn,1,tags['msg-param-recipient-display-name']||'?',{},tags);
            if(mt==='submysterygift') self._emit('submysterygift',ch2,dn,parseInt(tags['msg-param-mass-gift-count']||'1'),{},tags);
            if(mt==='raid')    self._emit('raided',ch2,dn,parseInt(tags['msg-param-viewerCount']||'0'));
        }
    });
};
G.tmi={Client};
})(window);
