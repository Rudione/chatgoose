(function(G){
function Client(o){
    this._ch=(o.channels||[]).map(c=>c.toLowerCase().replace('#',''));
    this._h={};
    this._ws=null;
}
Client.prototype.on=function(ev,fn){
    this._h[ev]=(this._h[ev]||[]).concat(fn);
    return this;
};
Client.prototype._emit=function(ev){
    var a=Array.prototype.slice.call(arguments,1);
    (this._h[ev]||[]).forEach(fn=>{try{fn.apply(null,a);}catch(e){console.error(e);}});
};
Client.prototype.connect=function(){
    var self=this;
    return new Promise((res,rej)=>{
        try{self._ws=new WebSocket('wss://irc-ws.chat.twitch.tv:443');}
        catch(e){return rej(e);}
        self._ws.onopen=()=>{
            self._ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
            var r=Math.floor(Math.random()*999999);
            self._ws.send('PASS oauth:justinfan'+r);
            self._ws.send('NICK justinfan'+r);
            self._ch.forEach(ch=>self._ws.send('JOIN #'+ch));
            res();
        };
        self._ws.onerror=e=>rej(e);
        self._ws.onclose=()=>self._emit('disconnected');
        self._ws.onmessage=e=>self._parse(e.data);
    });
};
Client.prototype.disconnect=function(){if(this._ws)this._ws.close();};
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
        if(line==='PING :tmi.twitch.tv'){self._ws.send('PONG :tmi.twitch.tv');return;}
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
