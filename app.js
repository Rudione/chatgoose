const BANNED = ['nword','negr','pidor','p1dor','kill yourself','kys','даун','ниггер','пидор','шлюха','хохол','москаль'];
const FAKEWORDS_FALLBACK = ['серьезно','вообще','просто','конечно','точно','реально','кстати','короче','честно','буквально','именно','внезапно','нормально','абсолютно','ладно'];

const URL_RE = /https?:\/\/[^\s]+/i;
function extractUrl(txt){const m=txt.match(URL_RE);return m?m[0]:null;}
function getYtId(url){const m=url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);return m?m[1]:null;}
async function fetchYtTitle(url){try{const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(url));if(!r.ok)return null;const j=await r.json();return{title:j.title||null,author:j.author_name||null};}catch(e){return null;}}
async function fetchSpotifyMeta(url){try{const r=await fetch('https://open.spotify.com/oembed?url='+encodeURIComponent(url));if(!r.ok)return null;const j=await r.json();return{title:j.title||null,thumb:j.thumbnail_url||null};}catch(e){return null;}}
function getTwitchClipThumbnail(url){const m1=url.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/);const m2=url.match(/twitch\.tv\/[^\/]+\/clip\/([A-Za-z0-9_-]+)/);const slug=(m1&&m1[1])||(m2&&m2[1]);if(!slug)return null;return'https://clips-media-assets2.twitch.tv/'+slug+'-preview-480x272.jpg';}
function isTwitchClip(url){return/clips\.twitch\.tv|twitch\.tv\/[^\/]+\/clip\//i.test(url);}
function getSpotifyInfo(url){const m=url.mпatch(/open\.spotify\.com\/(intl-[a-z]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/);if(m)return{type:m[2],id:m[3]};const m2=url.match(/spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);if(m2)return{type:m2[1],id:m2[2]};return null;}
function isSpotify(url){return/spotify\.com/i.test(url);}
function isYouTube(url){return/youtube\.com|youtu\.be/i.test(url);}

const Emotes={
    map:new Map(),set7tv:new Map(),pfpMap:new Map(),
    async load(ch){
        const st=document.getElementById('emote-status');if(st)st.innerText=t('emotesLoading');
        try{
            const u=await(await fetch('https://api.ivr.fi/v2/twitch/user?login='+ch)).json();
            if(!u[0]){if(st)st.innerText='';return;}
            app._twitchUserId=u[0].id;
            const em=await(await fetch('https://7tv.io/v3/users/twitch/'+u[0].id)).json();
            if(em.emote_set?.emotes)em.emote_set.emotes.forEach(e=>{const url='https://cdn.7tv.app/emote/'+e.id+'/2x.webp';this.map.set(e.name,url);this.set7tv.set(e.name,url);});
            try{const g=await(await fetch('https://7tv.io/v3/emote-sets/global')).json();if(g.emotes)g.emotes.forEach(e=>{if(!this.map.has(e.name))this.map.set(e.name,'https://cdn.7tv.app/emote/'+e.id+'/2x.webp');});}catch(e){}
            if(st)st.innerText=t('emotesLoaded')+this.map.size+t('emotes7tvCount')+this.set7tv.size+')';
        }catch(e){if(st)st.innerText='';}
    },
    async getPfp(name){
        if(this.pfpMap.has(name))return this.pfpMap.get(name);
        try{const r=await(await fetch('https://api.ivr.fi/v2/twitch/user?login='+name)).json();if(r[0]?.logo){this.pfpMap.set(name,r[0].logo);return r[0].logo;}}catch(e){}
        return null;
    },
    isEmote(w){return this.map.has(w);},is7tv(w){return this.set7tv.has(w);},url(w){return this.map.get(w);},
    parse(txt){
        if(!txt||txt.startsWith('<'))return txt||'';
        return txt.split(' ').map(w=>this.map.has(w)?`<img src="${this.map.get(w)}" alt="${w}" class="chat-emote">`:w.replace(/</g,'&lt;').replace(/>/g,'&gt;')).join(' ');
    }
};

const LiveEvents={
    enabled:true,
    show(html,type='event-sub',duration=6000,important=false){
        if(!this.enabled)return;
        const panel=document.getElementById('live-events');if(!panel)return;
        const card=document.createElement('div');card.className='live-event-card '+type+(important?' important':'');card.innerHTML=html;
        panel.appendChild(card);Sound.event();
        while(panel.children.length>5)panel.removeChild(panel.firstChild);
        setTimeout(()=>{card.style.opacity='0';card.style.transform='translateX(-60px)';card.style.transition='all .4s';setTimeout(()=>card.remove(),420);},duration);
    }
};

const Storage={
    KEYS:{settings:'cg_settings',session:'cg_session',history:'cg_h'},
    save(key,data){try{localStorage.setItem(key,JSON.stringify(data));}catch(e){}},
    load(key,def=null){try{const v=localStorage.getItem(key);return v?JSON.parse(v):def;}catch(e){return def;}},
    clear(key){try{localStorage.removeItem(key);}catch(e){}},
    clearAll(){Object.values(this.KEYS).forEach(k=>this.clear(k));}
};

window.app={
    client:null,users:new Map(),allMessages:[],wordBank:[],
    playedMessages:new Set(),questionRoundCount:0,
    _collectingMessages:false,
    config:{needed:20,rounds:20,timerPer:0,timerTotal:0,allowRepeat:true,showBadges:true,finalRound:true,mediaMode:true,activeModes:[],access:'all',limitQuestions:false,linksOnly:false,vipAsMod:true},
    state:{active:false,round:0,score:0,streak:0,bestStreak:0,hints:{fifty:true,skip:true,reveal:true},currentMode:'',currentMissingWord:'',timerIv:null,timerLeft:0,totalIv:null,totalLeft:0,correct:0,wrong:0},
    BUFFER_MAX:300,

    openRules(){const m=document.getElementById('rules-modal');m.classList.remove('hidden');requestAnimationFrame(()=>m.classList.add('show'));Sound.click();},
    closeRules(){const m=document.getElementById('rules-modal');m.classList.remove('show');setTimeout(()=>m.classList.add('hidden'),300);Sound.click();},
    openFaq(){const m=document.getElementById('faq-modal');m.classList.remove('hidden');requestAnimationFrame(()=>m.classList.add('show'));Sound.click();},
    closeFaq(){const m=document.getElementById('faq-modal');m.classList.remove('show');setTimeout(()=>m.classList.add('hidden'),300);Sound.click();},
    openSettings(){document.getElementById('settings-panel').classList.add('open');document.getElementById('settings-scrim').classList.add('open');Sound.click();},
    closeSettings(){
        document.getElementById('settings-panel').classList.remove('open');
        document.getElementById('settings-scrim').classList.remove('open');
        this._readSettings();
        this._buildWarningPreScreen();
        Sound.click();
    },

    soundOn:true,eventsOn:true,
    toggleSound(){this.soundOn=!this.soundOn;Sound.enabled=this.soundOn;const b=document.getElementById('btn-sound');b.classList.toggle('off',!this.soundOn);b.querySelector('span:first-child').textContent=this.soundOn?'🔊':'🔇';if(this.soundOn)Sound.click();},
    toggleEvents(){this.eventsOn=!this.eventsOn;LiveEvents.enabled=this.eventsOn;const b=document.getElementById('btn-events');b.classList.toggle('off',!this.eventsOn);b.querySelector('span:first-child').textContent=this.eventsOn?'🔔':'🔕';Sound.click();if(!this.eventsOn){const p=document.getElementById('live-events');if(p)p.innerHTML='';}},

    switchTab(tab){
        ['game','modes','timer'].forEach(t=>{document.getElementById('settings-'+t).style.display=t===tab?'block':'none';document.getElementById('tab-'+t).classList.toggle('active',t===tab);});
        Sound.click();
    },
    toggleTimerMode(el,which){
        if(which==='per'){document.getElementById('timer-per-section').style.display=el.checked?'block':'none';if(el.checked){document.getElementById('opt-timer-total').checked=false;document.getElementById('timer-total-section').style.display='none';}}
        else{document.getElementById('timer-total-section').style.display=el.checked?'block':'none';if(el.checked){document.getElementById('opt-timer-per').checked=false;document.getElementById('timer-per-section').style.display='none';}}
    },
    updateSlider(el){
        const v=el.value,r=(v-el.min)/(el.max-el.min)*100;
        el.style.background='linear-gradient(90deg,var(--c-accent) '+r+'%,rgba(255,255,255,0.08) '+r+'%)';
        const sv=document.getElementById('slider-val');if(sv)sv.innerText=v;
    },

    _readSettings(){
        this.config.needed=parseInt(document.getElementById('users-slider').value);
        this.config.allowRepeat=document.getElementById('opt-repeat').checked;
        this.config.showBadges=document.getElementById('opt-badges').checked;
        this.config.finalRound=document.getElementById('opt-final').checked;
        this.config.mediaMode=document.getElementById('opt-media').checked;
        this.config.limitQuestions=document.getElementById('opt-noq').checked;
        this.config.vipAsMod=(document.querySelector('input[name="modrole"]:checked')?.value||'3')==='2';
        this.config.access=document.querySelector('input[name="access"]:checked')?.value||'all';
        this.config.timerPer=0;this.config.timerTotal=0;
        if(document.getElementById('opt-timer-per').checked)this.config.timerPer=parseInt(document.getElementById('timer-per-slider').value);
        if(document.getElementById('opt-timer-total').checked)this.config.timerTotal=parseInt(document.getElementById('timer-total-slider').value)*60;
        const lo=document.querySelector('input[name="msgfilter"]:checked');
        this.config.linksOnly=lo?lo.value==='links':false;
        const mids=['classic','tf','censor','tf2','modview','media','emote','detective','firstword','2of4','7tv'];
        this.config.activeModes=mids.filter(m=>document.getElementById('mode-'+m)?.checked);
        if(!this.config.activeModes.length)this.config.activeModes=['classic'];
        this._saveSettings();
    },

    _saveSettings(){
        Storage.save(Storage.KEYS.settings,{
            needed:this.config.needed,allowRepeat:this.config.allowRepeat,showBadges:this.config.showBadges,
            finalRound:this.config.finalRound,mediaMode:this.config.mediaMode,limitQuestions:this.config.limitQuestions,
            vipAsMod:this.config.vipAsMod,access:this.config.access,timerPer:this.config.timerPer,
            timerTotal:this.config.timerTotal,linksOnly:this.config.linksOnly,activeModes:this.config.activeModes,
            channel:document.getElementById('channel-input')?.value||''
        });
    },

    loadSettings(){
        const s=Storage.load(Storage.KEYS.settings);
        if(!s)return;
        const set=(id,val)=>{const el=document.getElementById(id);if(el&&typeof val==='boolean')el.checked=val;else if(el)el.value=val;};
        if(s.needed){set('users-slider',s.needed);const sv=document.getElementById('slider-val');if(sv)sv.innerText=s.needed;const sl=document.getElementById('users-slider');if(sl)this.updateSlider(sl);}
        if(typeof s.allowRepeat!=='undefined')set('opt-repeat',s.allowRepeat);
        if(typeof s.showBadges!=='undefined')set('opt-badges',s.showBadges);
        if(typeof s.finalRound!=='undefined')set('opt-final',s.finalRound);
        if(typeof s.mediaMode!=='undefined')set('opt-media',s.mediaMode);
        if(typeof s.limitQuestions!=='undefined')set('opt-noq',s.limitQuestions);
        if(s.access){const r=document.querySelector('input[name="access"][value="'+s.access+'"]');if(r)r.checked=true;}
        if(s.vipAsMod!==undefined){const r=document.querySelector('input[name="modrole"][value="'+(s.vipAsMod?'2':'3')+'"]');if(r)r.checked=true;}
        if(s.timerPer){set('opt-timer-per',true);const sl=document.getElementById('timer-per-slider');if(sl){sl.value=s.timerPer;const v=document.getElementById('timer-per-val');if(v)v.innerText=s.timerPer;}document.getElementById('timer-per-section').style.display='block';}
        if(s.timerTotal){set('opt-timer-total',true);const min=s.timerTotal/60;const sl=document.getElementById('timer-total-slider');if(sl){sl.value=min;const v=document.getElementById('timer-total-val');if(v)v.innerText=min;}document.getElementById('timer-total-section').style.display='block';}
        if(s.linksOnly){const r=document.querySelector('input[name="msgfilter"][value="links"]');if(r){r.checked=true;r.closest('.msg-filter-tab')?.classList.add('active');const other=document.querySelector('input[name="msgfilter"][value="all"]');if(other)other.closest('.msg-filter-tab')?.classList.remove('active');}}
        if(s.activeModes&&s.activeModes.length){const mids=['classic','tf','censor','tf2','modview','media','emote','detective','firstword','2of4','7tv'];mids.forEach(m=>{const el=document.getElementById('mode-'+m);if(el)el.checked=s.activeModes.includes(m);});}
        if(s.channel){const ci=document.getElementById('channel-input');if(ci)ci.value=s.channel;}
        this._readSettings();
    },

    resetSettings(){
        Storage.clearAll();
        location.reload();
    },

    checkAccess(tags){
        const access=this.config.access;
        if(access==='all')return true;
        if(access==='sub')return!!(tags.subscriber||tags.badges?.subscriber||tags.badges?.broadcaster);
        if(access==='vip')return!!(tags.badges?.vip||tags.badges?.moderator||tags.badges?.broadcaster||tags.mod);
        if(access==='follower')return!!(tags['badge-info']||tags.badges?.subscriber||tags.badges?.broadcaster||tags.mod||tags.badges?.vip||this._followers?.has((tags['display-name']||'').toLowerCase()));
        return true;
    },

    harvestWords(text){
        if(!text)return;
        if(!this._wordFreq)this._wordFreq=new Map();
        text.split(/\s+/).forEach(raw=>{
            const w=raw.replace(/[^\wа-яёА-ЯЁ-]/gi,'');
            if(w.length<4||w.length>16)return;
            if(Emotes.isEmote(raw)||Emotes.isEmote(w))return;
            if(/^https?/i.test(w)||/\d/.test(w))return;
            if(/[a-z]/i.test(w)&&/[а-яё]/i.test(w))return;
            const key=w.toLowerCase();
            this._wordFreq.set(key,(this._wordFreq.get(key)||0)+1);
        });
        if(!this._bankDirty)this._bankDirty=0;
        this._bankDirty++;
        if(this._bankDirty>=8){this._rebuildBank();this._bankDirty=0;}
    },
    _rebuildBank(){
        if(!this._wordFreq)this._wordFreq=new Map();
        const entries=[...this._wordFreq.entries()];
        const total=entries.reduce((s,e)=>s+e[1],0);
        const minFreq=total>400?2:1;
        this.wordBank=entries.filter(e=>e[1]>=minFreq).map(e=>({w:e[0],f:e[1],len:e[0].length,lat:/[a-z]/i.test(e[0])})).sort((a,b)=>b.f-a.f);
        if(this.wordBank.length>600)this.wordBank.length=600;
    },
    _matchCase(fake,original){
        if(!original)return fake;
        if(original===original.toUpperCase()&&original.length>1)return fake.toUpperCase();
        if(original[0]===original[0].toUpperCase())return fake[0].toUpperCase()+fake.slice(1);
        return fake;
    },
    getFakeWord(avoid){
        avoid=(avoid||[]).map(x=>(x||'').toLowerCase());
        if(!this.wordBank||!this.wordBank.length)this._rebuildBank();
        const bank=this.wordBank||[];
        for(let i=0;i<60;i++){if(!bank.length)break;const e=bank[Math.floor(Math.random()*bank.length)];if(e&&!avoid.includes(e.w))return e.w;}
        for(let i=0;i<20;i++){const w=FAKEWORDS_FALLBACK[Math.floor(Math.random()*FAKEWORDS_FALLBACK.length)];if(!avoid.includes(w.toLowerCase()))return w;}
        return FAKEWORDS_FALLBACK[0];
    },
    getFakeWordLike(original,avoid){
        const av=(avoid||[]).map(x=>(x||'').toLowerCase());
        if(!this.wordBank||!this.wordBank.length)this._rebuildBank();
        const bank=this.wordBank||[];
        const clean=(original||'').replace(/[^\wа-яёА-ЯЁ-]/gi,'');
        const len=clean.length;const lat=/[a-z]/i.test(clean);
        let pool=bank.filter(e=>e.lat===lat&&Math.abs(e.len-len)<=1&&!av.includes(e.w)&&e.w!==clean.toLowerCase());
        if(pool.length<3)pool=bank.filter(e=>e.lat===lat&&Math.abs(e.len-len)<=2&&!av.includes(e.w)&&e.w!==clean.toLowerCase());
        if(pool.length<3)pool=bank.filter(e=>e.lat===lat&&!av.includes(e.w)&&e.w!==clean.toLowerCase());
        let chosen;
        if(pool.length){const idx=Math.floor(Math.pow(Math.random(),1.6)*pool.length);chosen=pool[idx].w;}
        else{chosen=this.getFakeWord(av);}
        return this._matchCase(chosen,original);
    },

    isQuestion(text){return/[?？]\s*$/.test((text||'').trim());},

    connect(){
        const ch=document.getElementById('channel-input').value.trim();
        if(!ch){document.getElementById('channel-input').style.borderColor='var(--c-red)';return;}
        this._readSettings();
        document.getElementById('users-target').innerText='/'+this.config.needed;
        Sound.click();
        this._connectedChannel=ch;
        this._saveSettings();
        this.switchScene('warning-pre');
        this._buildWarningPreScreen();
        Emotes.load(ch);

        this.client=new tmi.Client({channels:[ch]});
        this.client.connect().catch(e=>{alert(t('errConnecting')+e);this.switchScene('login');});

        this.client.on('message',(c,tags,m,self)=>{
            if(self)return;
            const name=tags['display-name']||tags['username'];
            const lm=m.toLowerCase();
            if((tags.mod||tags.badges?.broadcaster||tags.badges?.moderator)&&lm.startsWith('!s ')){
                const msg=m.slice(3).trim();
                if(this.state.active&&msg)LiveEvents.show('<div class="lev-head" style="color:var(--c-accent2);">'+t('eventModPrefix')+name+t('eventModSuffix')+'</div><div style="font-size:13px;">'+Emotes.parse(msg)+'</div>','event-mod',9000,true);
                return;
            }
            if(m.startsWith('!')||m.length<2)return;
            if(BANNED.some(w=>lm.includes(w)))return;

            const url=extractUrl(m);
            this.harvestWords(m);

            if(!this.state.active&&this._collectingMessages){
                if(this.config.linksOnly&&!url)return;
                if(!this.checkAccess(tags))return;
                const entry={name,text:m,url,tags};
                this.allMessages.push(entry);
                if(this.allMessages.length>this.BUFFER_MAX)this.allMessages.shift();
                if(this.users.size>=this.config.needed&&!this.users.has(name))return;
                if(!this.users.has(name)){
                    this.users.set(name,{name,text:m,isMod:!!(tags.mod||tags.badges?.broadcaster),color:tags.color||'#9ca3af',tags,messages:[m],urls:url?[url]:[]});
                    this.updateProgress();this.addUserCard(name);
                }else if(this.config.allowRepeat){
                    const u=this.users.get(name);
                    if(!u.messages.includes(m)&&u.messages.length<3)u.messages.push(m);
                    if(url&&!u.urls.includes(url)&&u.urls.length<3)u.urls.push(url);
                }
            } else if(this.state.active){
                const entry={name,text:m,url,tags};
                this.allMessages.push(entry);
                if(this.allMessages.length>this.BUFFER_MAX)this.allMessages.shift();
            }
        });

        this.client.on('subgift',(c,gN,sm,rN)=>{if(!this.state.active)return;LiveEvents.show('<div class="lev-head" style="color:var(--c-gold);">'+t('eventGift')+'</div><div><b>'+gN+'</b>'+t('eventGiftMsg')+'<b>'+rN+'</b></div>','event-gift',8000,true);});
        this.client.on('submysterygift',(c,gN,cnt)=>{if(!this.state.active)return;LiveEvents.show('<div class="lev-head" style="color:var(--c-gold);">'+t('eventMassGift')+'</div><div><b>'+gN+'</b>'+t('eventMassGiftMsg')+'<b>'+cnt+'</b>'+t('eventMassGiftSuffix')+'</div>','event-gift',9000,true);});
        this.client.on('subscription',(c,un)=>{if(!this.state.active)return;LiveEvents.show('<div class="lev-head" style="color:var(--c-gold);">'+t('eventSub')+'</div><div><b>'+un+'</b>'+t('eventSubMsg')+'</div>','event-sub',7000,true);});
        this.client.on('resub',(c,un,mo)=>{if(!this.state.active)return;LiveEvents.show('<div class="lev-head" style="color:var(--c-gold);">'+t('eventResub')+'</div><div><b>'+un+'</b>'+t('eventResubMsg')+mo+t('eventResubMo')+'</div>','event-sub',7000,true);});
        this.client.on('raided',(c,un,vw)=>{if(!this.state.active)return;LiveEvents.show('<div class="lev-head" style="color:var(--c-blue);">'+t('eventRaid')+'</div><div><b>'+un+'</b>'+t('eventRaidMsg')+'<b>'+vw+'</b>'+t('eventRaidViewers')+'</div>','event-raid',12000,true);});
        this.client.on('cheer',(c,tg2,m2)=>{if(!this.state.active)return;const bits=tg2.bits||'?';const n2=tg2['display-name']||tg2['username'];LiveEvents.show('<div class="lev-head" style="color:var(--c-green);">'+t('eventBits')+'</div><div><b>'+n2+'</b>'+t('eventBitsMsg')+'<b>'+bits+'</b>'+t('eventBitsSuffix')+'</div>','event-gift',7000,true);});
    },

    _getChannelHistory(){
        const ch=(this._connectedChannel||'').toLowerCase();
        const h=Storage.load(Storage.KEYS.history,[]);
        return h.filter(x=>x.channel&&x.channel.toLowerCase()===ch);
    },

    _buildWarningPreScreen(){
        const ch=this._connectedChannel||document.getElementById('channel-input')?.value?.trim()||'';

        const cnEl=document.getElementById('wp-channel-name');
        if(cnEl)cnEl.innerText=ch||'—';

        Emotes.getPfp(ch).then(pfp=>{
            const av=document.getElementById('wp-avatar');
            if(!av)return;
            if(pfp){av.outerHTML=`<img id="wp-avatar" src="${pfp}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--c-accent);box-shadow:0 0 18px rgba(139,125,255,.4);">`;}
        });

        const allH=Storage.load(Storage.KEYS.history,[]);
        const chH=allH.filter(x=>x.channel&&x.channel.toLowerCase()===ch.toLowerCase());
        const lastAll=allH[0];const lastCh=chH[0];

        const laEl=document.getElementById('wp-last-all');
        const lcEl=document.getElementById('wp-last-ch');
        if(laEl)laEl.innerText=lastAll?(lastAll.score+t('pointsSuffix')+' · '+lastAll.correct+'✅ '+lastAll.wrong+'❌'):t('noPrevResult');
        if(lcEl)lcEl.innerText=lastCh?(lastCh.score+t('pointsSuffix')+' · '+lastCh.correct+'✅ '+lastCh.wrong+'❌'):t('noPrevResult');

        const modesEl=document.getElementById('wp-modes-grid');
        if(modesEl){
            const modeMap={
                classic:{icon:'🎯',key:'modeClassic'},tf:{icon:'🤔',key:'modeTF'},censor:{icon:'🔤',key:'modeCensor'},
                tf2:{icon:'💬',key:'modeTF2'},modview:{icon:'🛡️',key:'modeModview'},media:{icon:'🖼️',key:'modeMedia'},
                emote:{icon:'😎',key:'modeEmote'},detective:{icon:'🕵️',key:'modeDetective'},
                firstword:{icon:'🔠',key:'modeFirstword'},'2of4':{icon:'👥',key:'mode2of4'},'7tv':{icon:'🎨',key:'mode7tv'}
            };
            const filterLabel=this.config.linksOnly?t('modeLinks'):t('modeAll');
            const filterColor=this.config.linksOnly?'var(--c-accent2)':'var(--c-accent)';
            modesEl.innerHTML=`<div style="grid-column:1/-1;margin-bottom:4px;display:flex;align-items:center;gap:8px;"><span style="font-size:10px;color:var(--c-muted);font-weight:700;text-transform:uppercase;letter-spacing:.07em;">Фильтр:</span><span style="font-size:12px;font-weight:700;color:${filterColor};background:rgba(139,125,255,0.12);border:1px solid rgba(139,125,255,0.28);padding:3px 10px;border-radius:50px;">${filterLabel}</span></div>`
            +this.config.activeModes.map(m=>{
                const def=modeMap[m]||{icon:'⚡',key:m};
                const label=t(def.key||m).replace(/^[^ ]+ /,'');
                return`<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(139,125,255,0.22);border-radius:12px;padding:9px 6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;"><span style="font-size:18px;">${def.icon}</span><span style="font-size:10px;font-weight:600;color:var(--c-muted);line-height:1.2;">${label}</span></div>`;
            }).join('');
        }

        const playerEl=document.getElementById('wp-players-target');
        if(playerEl)playerEl.innerText=this.config.needed+' '+t('playersSlider');

        const timerEl=document.getElementById('wp-timer-info');
        if(timerEl){
            if(this.config.timerPer)timerEl.innerText='⏱ '+this.config.timerPer+'с / вопрос';
            else if(this.config.timerTotal)timerEl.innerText='⏱ '+Math.round(this.config.timerTotal/60)+' мин всего';
            else timerEl.innerText='⏱ без таймера';
        }
    },

    proceedToLoading(){
        Sound.click();
        this._collectingMessages=true;
        this.switchScene('loading');
    },

    async addUserCard(name){
        const g=document.getElementById('joined-users-grid');
        const u=this.users.get(name);
        const color=u?.color||'#9ca3af';
        const badgeHtml=this.badges({user:u});
        const d=document.createElement('div');d.className='user-pill';
        d.innerHTML='<div style="width:28px;height:28px;border-radius:50%;background:rgba(139,125,255,0.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">'+name.charAt(0).toUpperCase()+'</div>'
            +'<span style="display:flex;align-items:center;gap:3px;min-width:0;">'+badgeHtml
            +'<span style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:'+color+';font-weight:700;">'+name+'</span></span>';
        g.appendChild(d);g.scrollTop=g.scrollHeight;
        try{const pfp=await Emotes.getPfp(name);if(pfp){const av=d.querySelector('div');if(av)av.outerHTML='<img src="'+pfp+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,.15);">';}}catch(e){}
    },

    updateProgress(){
        const c=this.users.size,n=this.config.needed,p=Math.min(c/n,1);
        document.getElementById('progress-ring').style.strokeDashoffset=251-(p*251);
        document.getElementById('users-count').innerText=c;
        const bs=document.getElementById('btn-start'),be=document.getElementById('btn-early-start');
        if(c>=n){bs.disabled=false;bs.style.opacity='1';bs.style.cursor='pointer';bs.innerText=t('startBtn');be.disabled=true;be.style.opacity='.4';}
        else if(c>=4){be.disabled=false;be.style.opacity='1';be.style.cursor='pointer';be.innerText=t('earlyStartBtn')+' ('+c+'/'+n+')';}
    },

    goBack(){
        try{if(this.client){this.client.disconnect();this.client=null;}}catch(e){}
        this.users=new Map();this.allMessages=[];this.wordBank=[];this._wordFreq=new Map();this._bankDirty=0;
        this._collectingMessages=false;
        this.playedMessages=new Set();this.questionRoundCount=0;this._emoteOrWordUsed=false;this._firstWordTrapCount=0;
        this.state={active:false,round:0,score:0,streak:0,bestStreak:0,hints:{fifty:true,skip:true,reveal:true},currentMode:'',currentMissingWord:'',timerIv:null,timerLeft:0,totalIv:null,totalLeft:0,correct:0,wrong:0};
        document.getElementById('joined-users-grid').innerHTML='';
        document.getElementById('users-count').innerText='0';
        document.getElementById('progress-ring').style.strokeDashoffset='251';
        const bs=document.getElementById('btn-start'),be=document.getElementById('btn-early-start');
        bs.disabled=true;bs.style.opacity='.4';bs.style.cursor='not-allowed';bs.innerText=t('waitingBtn');
        be.disabled=true;be.style.opacity='.4';be.style.cursor='not-allowed';
        Storage.clear(Storage.KEYS.session);
        this.switchScene('login');Sound.click();
    },

    exitGame(){
        if(!confirm('Выйти из игры?'))return;
        this.goBack();
    },

    startCountdown(){
        Sound.click();
        const cd=document.getElementById('scene-countdown');cd.classList.remove('hidden');
        ['login','loading','warning-pre','warning','game','final','result'].forEach(s=>{const el=document.getElementById('scene-'+s);if(el)el.classList.add('hidden');});
        let n=3;const el=document.getElementById('countdown-num');
        const show=v=>{el.innerText=v;el.style.animation='none';void el.offsetWidth;el.style.animation='countdownPop .6s cubic-bezier(0.34,1.56,0.64,1)';};
        show(n);Sound.tick();
        const iv=setInterval(()=>{n--;if(n>0){show(n);Sound.tick();}else{clearInterval(iv);show('GO!');Sound.go();setTimeout(()=>this.startGame(),900);}},1000);
    },

    startGame(){
        const pool=[];
        this.users.forEach(u=>{
            u.messages.forEach((msg,i)=>{
                if(this.config.linksOnly&&!extractUrl(msg))return;
                pool.push({user:u,name:u.name,text:msg,msgId:u.name+'::'+i});
            });
        });
        let total=pool.length;
        if(total<1)total=1;
        this.config.rounds=Math.min(total,Math.max(this.users.size,20));
        if(this.config.linksOnly&&total<this.config.rounds)this.config.rounds=total;
        this.gamePool=pool;
        this._emoteOrWordUsed=false;this._firstWordTrapCount=0;this._authorQuestionTexts=new Set();this._usedMediaCombos=new Set();

        document.getElementById('scene-countdown').classList.add('hidden');
        document.getElementById('hud').style.display='flex';
        document.getElementById('history-panel').style.display='block';
        document.getElementById('history-list').innerHTML='';
        document.getElementById('history-panel-title').innerText=t('historyLabel');
        document.getElementById('live-events').style.display='flex';
        document.getElementById('btn-exit-game').style.display='flex';
        this.switchScene('game');
        this.state.active=true;
        this._saveSession();
        if(this.config.timerTotal>0){this.state.totalLeft=this.config.timerTotal;this.showTotalTimer();this.state.totalIv=setInterval(()=>{this.state.totalLeft--;this.showTotalTimer();if(this.state.totalLeft<=0){clearInterval(this.state.totalIv);this.endGame();}},1000);}
        this.nextRound();
    },

    _saveSession(){
        Storage.save(Storage.KEYS.session,{
            round:this.state.round,score:this.state.score,streak:this.state.streak,
            bestStreak:this.state.bestStreak,correct:this.state.correct,wrong:this.state.wrong,
            channel:this._connectedChannel,active:this.state.active
        });
    },

    showTotalTimer(){
        const tlo=document.getElementById('timer-bar-outer'),tl=document.getElementById('timer-label'),tb=document.getElementById('timer-bar');
        tlo.style.display='block';
        const m=Math.floor(this.state.totalLeft/60),s=this.state.totalLeft%60;
        tl.innerText=m+':'+(s<10?'0':'')+s;
        const pct=this.state.totalLeft/this.config.timerTotal*100;
        tb.style.width=pct+'%';tb.className=pct<25?'warn':'';
    },

    startPerTimer(){
        if(this.config.timerPer<=0)return;
        this.stopPerTimer();
        this.state.timerLeft=this.config.timerPer;
        const tlo=document.getElementById('timer-bar-outer'),tl=document.getElementById('timer-label'),tb=document.getElementById('timer-bar');
        if(!this.config.timerTotal)tlo.style.display='block';
        tl.innerText=this.state.timerLeft+'с';tb.style.width='100%';tb.className='';
        this.setVignette(0);
        this.state.timerIv=setInterval(()=>{
            this.state.timerLeft--;
            const pct=this.state.timerLeft/this.config.timerPer*100;
            tb.style.width=Math.max(0,pct)+'%';tl.innerText=Math.max(0,this.state.timerLeft)+'с';tb.className=pct<30?'warn':'';
            const left=this.state.timerLeft;
            if(left<=10&&left>0){const t2=(10-left)/10;this.setVignette(Math.min(0.5,0.12+t2*0.42),left<=4);}else{this.setVignette(0);}
            if(left<=3&&left>0)Sound.tick();
            if(left<=0){this.stopPerTimer();this.timeExpired();}
        },1000);
    },
    setVignette(opacity,pulse){const v=document.getElementById('timer-vignette');if(!v)return;v.style.opacity=opacity;v.classList.toggle('pulse',!!pulse&&opacity>0);},
    stopPerTimer(){if(this.state.timerIv){clearInterval(this.state.timerIv);this.state.timerIv=null;}this.setVignette(0);},
    timeExpired(){
        Sound.wrong();
        document.querySelectorAll('.answer-btn[data-correct="true"]').forEach(b=>b.classList.add('correct'));
        document.querySelectorAll('.answer-btn').forEach(b=>b.disabled=true);
        this.state.streak=0;this.state.wrong++;this.updateStreakUI();this.addHistory(false);
        setTimeout(()=>this.nextRound(),2000);
    },

    getModeList(){
        const mp={classic:'CLASSIC',tf:'TRUE_FALSE',censor:'CENSORED',tf2:'WHOSE_MSG',modview:'MOD_VS_VIEWER',media:'MEDIA',emote:'EMOTE_OR_WORD',detective:'DETECTIVE',firstword:'FIRST_WORD','2of4':'TWO_OF_FOUR','7tv':'GUESS_7TV'};
        return this.config.activeModes.map(k=>mp[k]).filter(Boolean);
    },

    getNextMessage(){
        const avail=this.gamePool.filter(p=>!this.playedMessages.has(p.msgId));
        if(!avail.length)return null;
        let candidates=avail;
        const fewModes=this.config.activeModes.length<=2;
        if(this.config.limitQuestions&&!fewModes){
            const maxQ=Math.floor(this.config.rounds*0.25);
            const nonQ=avail.filter(p=>!this.isQuestion(p.text));
            const qOnly=avail.filter(p=>this.isQuestion(p.text));
            const qBudgetLeft=maxQ-this.questionRoundCount;
            if(qBudgetLeft<=0){candidates=nonQ.length?nonQ:avail;}
            else if(nonQ.length){const roundsLeft=this.config.rounds-this.state.round;const spendChance=Math.min(0.35,qBudgetLeft/Math.max(roundsLeft,1));candidates=(Math.random()<spendChance&&qOnly.length)?qOnly:nonQ;}
            else{candidates=avail;}
        }
        const pick=candidates[Math.floor(Math.random()*candidates.length)];
        this.playedMessages.add(pick.msgId);
        if(this.isQuestion(pick.text))this.questionRoundCount++;
        return pick;
    },

    nextRound(){
        this.stopPerTimer();
        if(this.state.round>=this.config.rounds){
            if(this.config.finalRound&&this.users.size>=2)this.startFinalRound();
            else this.endGame();
            return;
        }
        const target=this.getNextMessage();
        if(!target){
            if(this.config.finalRound&&this.users.size>=2)this.startFinalRound();
            else this.endGame();
            return;
        }
        this.state.round++;
        this.updateHeader();
        document.getElementById('answers-grid').innerHTML='';
        const qa=document.getElementById('question-area');qa.style.animation='none';void qa.offsetWidth;qa.style.animation='fadeUp .4s ease-out';
        const gc=document.getElementById('game-card');gc.style.animation='none';void gc.offsetWidth;gc.style.animation='scaleIn .35s cubic-bezier(0.16,1,0.3,1)';

        let modes=this.getModeList();
        const hasUrls=this.allMessages.some(m=>m.url)||Array.from(this.users.values()).some(u=>u.urls&&u.urls.length>0);
        if(!hasUrls)modes=modes.filter(m=>m!=='MEDIA');
        if(this.config.linksOnly)modes=modes.filter(m=>m!=='EMOTE_OR_WORD'&&m!=='GUESS_7TV'&&m!=='FIRST_WORD'&&m!=='CENSORED'&&m!=='TRUE_FALSE');

        const getUserMsgCount=name=>{const u=this.users.get(name);const s=new Set(u?u.messages:[]);this.allMessages.forEach(m=>{if(m.name===name)s.add(m.text);});return s.size;};
        const hasMulti=Array.from(this.users.keys()).some(n=>getUserMsgCount(n)>=2);
        if(!hasMulti)modes=modes.filter(m=>m!=='TWO_OF_FOUR'&&m!=='DETECTIVE');
        if(this._emoteOrWordUsed)modes=modes.filter(m=>m!=='EMOTE_OR_WORD');
        if(Emotes.map.size===0)modes=modes.filter(m=>m!=='EMOTE_OR_WORD');
        if(Emotes.set7tv.size<5)modes=modes.filter(m=>m!=='GUESS_7TV');
        if(!this._authorQuestionTexts)this._authorQuestionTexts=new Set();
        if(this._authorQuestionTexts.has(target.text)){const filtered=modes.filter(m=>m!=='CLASSIC'&&m!=='MEDIA');if(filtered.length)modes=filtered;}
        if(!modes.length)modes=['CLASSIC'];

        const mode=modes[Math.floor(Math.random()*modes.length)];
        this.state.currentMode=mode;
        if(mode==='CLASSIC'||mode==='MEDIA')this._authorQuestionTexts.add(target.text);

        const renders={
            CLASSIC:()=>this.renderClassic(target),TRUE_FALSE:()=>this.renderTF(target),CENSORED:()=>this.renderCensored(target),
            WHOSE_MSG:()=>this.renderWhoseMsg(target),MOD_VS_VIEWER:()=>this.renderModView(target),MEDIA:()=>this.renderMedia(target),
            EMOTE_OR_WORD:()=>{this._emoteOrWordUsed=true;this.renderEmoteOrWord(target);},DETECTIVE:()=>this.renderDetective(target),
            FIRST_WORD:()=>this.renderFirstWord(target),TWO_OF_FOUR:()=>this.renderTwoOfFour(target),GUESS_7TV:()=>this.renderGuess7tv(target)
        };
        (renders[mode]||renders.CLASSIC)();
        this.startPerTimer();
        this._saveSession();
    },

    getDistractors(corr,n){const names=Array.from(this.users.keys()).filter(x=>x!==corr);this.shuffle(names);return names.slice(0,n);},
    getRandomUser(ex){const a=Array.from(this.users.values());if(!a.length)return null;if(a.length===1)return a[0];let u,tries=0;do{u=a[Math.floor(Math.random()*a.length)];tries++;}while(ex&&u.name===ex&&tries<20);return u;},
    shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;},

    badges(u){
        if(!this.config.showBadges||!u?.user?.tags)return'';
        const tg=u.user.tags;let h='';
        if(tg.badges?.broadcaster||tg['badges-raw']?.includes('broadcaster'))h+='<span class="badge-broadcaster">📺</span>';
        else if(tg.mod||tg.badges?.moderator)h+='<span class="badge-moderator">⚔️</span>';
        if(tg.badges?.vip)h+='<span class="badge-vip">💎</span>';
        if(tg.badges?.subscriber)h+='<span class="badge-sub">⭐</span>';
        return h;
    },
    nickHtml(u){const c=u.user?.color||'#9ca3af';return'<span style="display:inline-flex;align-items:center;gap:4px;">'+this.badges(u)+'<span style="color:'+c+';font-weight:700;">'+u.name+'</span></span>';},
    nickColor(name){const u=this.users.get(name);const c=u?.color||'#9ca3af';return'<span style="display:inline-flex;align-items:center;gap:4px;">'+this.badges({user:u})+'<span style="color:'+c+';font-weight:700;">'+name+'</span></span>';},
    setBadge(txt,color){const b=document.getElementById('mode-badge');b.innerText=txt;b.style.color=color;b.style.borderColor=color+'44';},
    normWordOptions(words,sourceText){const allCaps=sourceText&&sourceText===sourceText.toUpperCase()&&/[a-zа-яё]/i.test(sourceText);return words.map(w=>allCaps?w.toUpperCase():w.toLowerCase());},

    renderClassic(u){
        this.setBadge(t('badgeClassic'),'var(--c-accent)');
        document.getElementById('question-area').innerHTML='<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">'+t('questionClassic')+'</div><div class="glass2" style="padding:17px 20px;font-size:19px;">"'+Emotes.parse(u.text)+'"</div>';
        const opts=this.getDistractors(u.name,3);opts.push(u.name);this.shuffle(opts);
        this.renderAnswers(opts.map(n=>({html:this.nickColor(n),correct:n===u.name})));
    },

    renderTF(u){
        this.setBadge(t('badgeTF'),'var(--c-blue)');
        const words=u.text.split(' ');
        const rwIdx=[];
        words.forEach((w,i)=>{const c=w.replace(/[^\wа-яёА-ЯЁ-]/gi,'');if(c.length>3&&!Emotes.isEmote(w))rwIdx.push(i);});
        const isGenuine=rwIdx.length===0||Math.random()<0.025;
        if(isGenuine){
            document.getElementById('question-area').innerHTML='<div style="margin-bottom:8px;">'+this.nickHtml(u)+t('writtenBy')+'</div><div class="glass2" style="padding:17px 20px;font-size:19px;">"'+Emotes.parse(u.text)+'"</div><div style="font-size:11px;color:var(--c-muted);margin-top:8px;">'+t('questionTF')+'</div>';
            const decoys=[];
            if(rwIdx.length){const sample=words[rwIdx[Math.floor(Math.random()*rwIdx.length)]];let tries=0;while(decoys.length<4&&tries<60){tries++;const fw=this.getFakeWordLike(sample,decoys);if(fw&&!decoys.includes(fw))decoys.push(fw);}}
            while(decoys.length<4){const fw=this.getFakeWord(decoys);if(!decoys.includes(fw))decoys.push(fw);else break;}
            const display=this.normWordOptions(decoys,u.text);this.shuffle(display);
            const list=display.map(w=>({html:w,correct:false}));
            list.push({html:t('answerNoSwap'),correct:true,fullWidth:true});
            this.renderAnswers(list);
        }else{
            const idx=rwIdx[Math.floor(Math.random()*rwIdx.length)];
            const original=words[idx];const originalClean=original.replace(/[^\wа-яёА-ЯЁ-]/gi,'');
            const fake=this.getFakeWordLike(original,[original,originalClean]);
            const shown=words.map((w,i)=>i===idx?'<span style="color:var(--c-gold);text-decoration:underline;font-weight:700;">'+fake+'</span>':Emotes.parse(w)).join(' ');
            document.getElementById('question-area').innerHTML='<div style="margin-bottom:8px;">'+this.nickHtml(u)+t('writtenBy')+'</div><div class="glass2" style="padding:17px 20px;font-size:19px;">"'+shown+'"</div><div style="font-size:11px;color:var(--c-muted);margin-top:8px;">'+t('questionTFSwapped')+'</div>';
            const opts=[originalClean];let tries=0;
            while(opts.length<4&&tries<70){tries++;const fw=this.getFakeWordLike(originalClean,opts.concat([fake]));if(fw&&!opts.includes(fw)&&fw!==fake)opts.push(fw);}
            while(opts.length<4){const fw=this.getFakeWord(opts.concat([fake]));if(!opts.includes(fw)&&fw!==fake)opts.push(fw);else break;}
            const correctNorm=(u.text===u.text.toUpperCase()&&/[a-zа-яё]/i.test(u.text))?originalClean.toUpperCase():originalClean.toLowerCase();
            const display=this.normWordOptions(opts,u.text);this.shuffle(display);
            const list=display.map(w=>({html:w,correct:w===correctNorm}));
            list.push({html:t('answerNoCorrect'),correct:false,fullWidth:true});
            this.renderAnswers(list);
        }
    },

    renderCensored(u){
        this.setBadge(t('badgeCensored'),'var(--c-accent2)');
        const words=u.text.split(' ');
        const cands=words.map((w,i)=>({w,i,c:w.replace(/[^\wа-яёА-ЯЁ-]/gi,'')})).filter(o=>o.c.length>3&&!Emotes.isEmote(o.w));
        if(!cands.length){this.state.currentMode='CLASSIC';this.renderClassic(u);return;}
        const tgt=cands[Math.floor(Math.random()*cands.length)];
        this.state.currentMissingWord=tgt.w;
        const proc=words.map((w,i)=>i===tgt.i?'<span id="censored-slot" style="color:var(--c-red);font-weight:800;letter-spacing:2px;background:rgba(255,107,145,.12);padding:2px 8px;border-radius:6px;">[???]</span>':Emotes.parse(w));
        document.getElementById('question-area').innerHTML='<div style="margin-bottom:8px;font-size:15px;color:var(--c-muted);">'+this.nickHtml(u)+t('censoredHint')+'</div><div class="glass2" style="padding:17px 20px;font-size:19px;">"'+proc.join(' ')+'"</div>';
        const opts=[tgt.w];let tries=0;
        while(opts.length<4&&tries<80){tries++;const fw=this.getFakeWordLike(tgt.w,opts);if(fw&&!opts.includes(fw))opts.push(fw);}
        const correctNorm=(u.text===u.text.toUpperCase()&&/[a-zа-яё]/i.test(u.text))?tgt.w.toUpperCase():tgt.w.toLowerCase();
        const display=this.normWordOptions(opts,u.text);this.shuffle(display);
        this.renderAnswers(display.map(w=>({html:w,correct:w===correctNorm})));
    },

    renderWhoseMsg(u){
        this.setBadge(t('badgeWhoseMsg'),'var(--c-green)');
        document.getElementById('question-area').innerHTML='<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">'+t('questionWhoseMsg')+'</div><div style="font-size:27px;font-weight:800;margin:8px 0;color:'+(u.user?.color||'#9ca3af')+';">'+u.name+'</div><div style="font-size:12px;color:var(--c-muted);">'+t('questionWhoseMsgSub')+'</div>';
        const correct=u.text;
        const pool=[];const seen=new Set([correct]);
        this.allMessages.forEach(m=>{if(m.name!==u.name&&!seen.has(m.text)&&m.text.length>2){seen.add(m.text);pool.push(m.text);}});
        Array.from(this.users.values()).forEach(v=>{if(v.name!==u.name&&!seen.has(v.text)){seen.add(v.text);pool.push(v.text);}});
        this.shuffle(pool);
        const opts=[correct,...pool.slice(0,3)];this.shuffle(opts);
        this.renderAnswers(opts.map(msg=>({html:'"'+Emotes.parse(msg.substring(0,52))+(msg.length>52?'…':'')+'"',correct:msg===correct})));
    },

    renderModView(u){
        const tg=u.user?.tags||{};
        const isBroadcaster=!!(tg.badges?.broadcaster);
        const isMod=!!(u.user?.isMod||tg.mod||tg.badges?.moderator)||isBroadcaster;
        const isVip=!!(tg.badges?.vip);
        const vipAsMod=this.config.vipAsMod!==false;
        if(vipAsMod){
            this.setBadge(t('badgeModView2'),'var(--c-green)');
            document.getElementById('question-area').innerHTML='<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">'+t('questionModView')+'</div><div class="glass2" style="padding:17px 20px;font-size:19px;">"'+Emotes.parse(u.text)+'"</div>';
            this.renderAnswers([{html:t('answerMod'),correct:isMod},{html:t('answerViewerShort'),correct:!isMod}]);
        }else{
            this.setBadge(t('badgeModView3'),'var(--c-green)');
            const role=isMod?'mod':(isVip?'vip':'viewer');
            document.getElementById('question-area').innerHTML='<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">'+t('questionModView')+'</div><div class="glass2" style="padding:17px 20px;font-size:19px;">"'+Emotes.parse(u.text)+'"</div>';
            this.renderAnswers([{html:t('answerMod'),correct:role==='mod'},{html:t('answerVip'),correct:role==='vip'},{html:t('answerViewer'),correct:role==='viewer'}]);
        }
    },

    _makeCopySquareBtn(url){
        return`<button class="copy-sq-btn" data-url="${encodeURIComponent(url)}" onclick="app.copyMediaLink(this)" title="${t('copyLink')}">📋</button>`;
    },
    _makeLinkPreview(url){
        const ytId=isYouTube(url)?getYtId(url):null;
        const clipThumb=!ytId&&isTwitchClip(url)?getTwitchClipThumbnail(url):null;
        if(ytId)return`<div class="link-preview"><img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" alt="" style="max-height:100px;width:100%;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'"></div>`;
        if(clipThumb)return`<div class="link-preview"><img src="${clipThumb}" alt="" style="max-height:100px;width:100%;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'"></div>`;
        return'';
    },

    renderMedia(u){
        const withUrls=Array.from(this.users.values()).filter(v=>v.urls&&v.urls.length>0);
        const liveMsgsWithUrl=this.allMessages.filter(m=>m.url);
        const usedCombos=this._usedMediaCombos||(this._usedMediaCombos=new Set());
        let mediaUser=null,mediaUrl=null;
        const candidates=[];
        withUrls.forEach(u2=>u2.urls.forEach(url=>candidates.push({user:u2,url})));
        liveMsgsWithUrl.forEach(m=>{const userObj=this.users.get(m.name)||{name:m.name,color:'#9ca3af',user:null};candidates.push({user:userObj,url:m.url});});
        this.shuffle(candidates);
        for(const cand of candidates){const key=cand.user.name+'::'+cand.url;if(!usedCombos.has(key)){mediaUser=cand.user;mediaUrl=cand.url;usedCombos.add(key);break;}}
        if(!mediaUser){if(candidates.length){mediaUser=candidates[0].user;mediaUrl=candidates[0].url;}else{this.state.currentMode='CLASSIC';this.renderClassic(u);return;}}
        this.setBadge(t('badgeMedia'),'var(--c-accent2)');
        const cardId='media-'+Date.now();
        const copyBtn=`<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px;">${this._makeCopySquareBtn(mediaUrl)}<span style="font-size:11px;color:var(--c-muted);">${t('copyLink')}</span></div>`;
        const sp=isSpotify(mediaUrl)?getSpotifyInfo(mediaUrl):null;
        const ytId=isYouTube(mediaUrl)?getYtId(mediaUrl):null;
        const clipThumb=!ytId&&!sp&&isTwitchClip(mediaUrl)?getTwitchClipThumbnail(mediaUrl):null;
        let mediaHtml='';
        if(ytId){
            mediaHtml='<div id="'+cardId+'" class="yt-card"><div class="yt-poster" onclick="app.playYouTube(\''+cardId+'\',\''+ytId+'\')"><img src="https://img.youtube.com/vi/'+ytId+'/hqdefault.jpg" alt="" onerror="this.src=\'https://img.youtube.com/vi/'+ytId+'/mqdefault.jpg\'"><div class="yt-play"><svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></div></div><div class="yt-meta"><div class="yt-title" id="'+cardId+'-title">'+t('ytVideo')+'</div><div class="yt-author" id="'+cardId+'-author">'+t('ytLoading')+'</div></div></div>';
        }else if(sp){
            mediaHtml='<div id="'+cardId+'" class="sp-card"><img class="sp-cover" id="'+cardId+'-cover" src="" alt="" style="display:none;"><div class="sp-cover sp-cover-ph" id="'+cardId+'-coverph">🎵</div><div class="sp-meta"><div class="sp-label">'+t('spotifyLabel')+'</div><div class="sp-title" id="'+cardId+'-title">'+t('spLoading')+'</div></div><button class="sp-play" onclick="app.playSpotify(\''+cardId+'\',\''+sp.type+'\',\''+sp.id+'\')"><svg width="18" height="18" viewBox="0 0 24 24" fill="#06120a"><path d="M8 5v14l11-7z"/></svg></button></div>';
        }else if(clipThumb){
            mediaHtml='<div class="media-card" style="max-width:340px;margin:0 auto;" onclick="this.querySelector(\'img\').classList.add(\'revealed\');const b=this.querySelector(\'.media-reveal-btn\');if(b)b.classList.add(\'hidden-icon\');"><img src="'+clipThumb+'" class="media-blur" style="width:100%;height:170px;object-fit:cover;display:block;"><div class="media-reveal-btn" style="background:rgba(145,70,255,0.4);">🎬</div><div style="font-size:10px;color:rgba(145,70,255,.85);padding:7px 10px;background:rgba(0,0,0,.5);">'+t('twitchClip')+'</div></div>';
        }else{
            let domain='ссылка';try{domain=new URL(mediaUrl).hostname.replace(/^www\./,'');}catch(e){}
            const short=mediaUrl.length>52?mediaUrl.slice(0,52)+'…':mediaUrl;
            mediaHtml='<div class="glass2" style="padding:14px 16px;max-width:360px;margin:0 auto;display:flex;align-items:center;gap:12px;"><div style="width:44px;height:44px;border-radius:12px;background:rgba(101,208,255,0.14);display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0;">🔗</div><div style="text-align:left;min-width:0;flex:1;"><div style="font-size:13px;font-weight:700;color:var(--c-blue);">'+domain+'</div><div style="font-size:10px;color:var(--c-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+short+'</div></div></div>';
        }
        document.getElementById('question-area').innerHTML='<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">'+t('questionMedia')+'</div><div style="max-width:380px;margin:0 auto;">'+mediaHtml+copyBtn+'</div>';
        if(ytId){fetchYtTitle(mediaUrl).then(meta=>{const tEl=document.getElementById(cardId+'-title');const aEl=document.getElementById(cardId+'-author');if(meta&&meta.title){if(tEl)tEl.textContent=meta.title;if(aEl)aEl.textContent=meta.author?('▶ '+meta.author):'YouTube';}else{if(aEl)aEl.textContent='YouTube';}});}
        if(sp){fetchSpotifyMeta(mediaUrl).then(meta=>{const tEl=document.getElementById(cardId+'-title');const cEl=document.getElementById(cardId+'-cover');const phEl=document.getElementById(cardId+'-coverph');if(meta&&meta.title&&tEl)tEl.textContent=meta.title;else if(tEl)tEl.textContent='Spotify трек';if(meta&&meta.thumb&&cEl){cEl.src=meta.thumb;cEl.style.display='block';if(phEl)phEl.style.display='none';}});}
        const opts=this.getDistractors(mediaUser.name,3);opts.push(mediaUser.name);this.shuffle(opts);
        this.renderAnswers(opts.map(n=>({html:this.nickColor(n),correct:n===mediaUser.name})));
    },

    playYouTube(cardId,ytId){const card=document.getElementById(cardId);if(!card)return;const poster=card.querySelector('.yt-poster');if(!poster)return;poster.outerHTML='<div class="yt-poster"><iframe width="100%" height="100%" style="border:0;border-radius:14px 14px 0 0;display:block;" src="https://www.youtube.com/embed/'+ytId+'?autoplay=1&rel=0" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe></div>';Sound.click();},
    playSpotify(cardId,type,id){const card=document.getElementById(cardId);if(!card)return;card.outerHTML='<div style="border-radius:14px;overflow:hidden;"><iframe style="border-radius:14px;display:block;" src="https://open.spotify.com/embed/'+type+'/'+id+'?utm_source=chatogus" width="100%" height="'+(type==='track'?'152':'232')+'" frameborder="0" allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture" loading="lazy"></iframe></div>';Sound.click();},

    copyMediaLink(btn){
        const url=decodeURIComponent(btn.dataset.url||'');
        const done=()=>{const o=btn.innerHTML;btn.innerHTML='✅';btn.classList.add('copied');setTimeout(()=>{btn.innerHTML=o;btn.classList.remove('copied');},1400);};
        try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done,()=>this._copyFallback(url,done));}else this._copyFallback(url,done);}catch(e){this._copyFallback(url,done);}
        Sound.click();
    },
    _copyFallback(text,done){try{const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0;';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);done();}catch(e){}},

    renderEmoteOrWord(u){
        const words=u.text.trim().split(/\s+/);if(words.length<2){this.state.currentMode='CLASSIC';this.renderClassic(u);return;}
        this.setBadge(t('badgeEmote'),'var(--c-blue)');
        const last=words[words.length-1];
        const is7tv=Emotes.is7tv(last);const isEmote=Emotes.isEmote(last);
        let correctType=is7tv?'7tv':(isEmote?'emote':'word');
        const shown=words.slice(0,-1).map(w=>Emotes.parse(w)).join(' ')+' <span style="color:var(--c-red);font-weight:800;background:rgba(255,107,145,.12);padding:2px 8px;border-radius:6px;">[ ? ]</span>';
        document.getElementById('question-area').innerHTML='<div style="margin-bottom:8px;font-size:15px;color:var(--c-muted);">'+this.nickHtml(u)+t('firstwordHint')+'</div><div class="glass2" style="padding:17px 20px;font-size:19px;">"'+shown+'"</div><div style="font-size:11px;color:var(--c-muted);margin-top:8px;">'+t('questionEmote')+'</div>';
        this.renderAnswers([{html:t('answer7tv'),correct:correctType==='7tv'},{html:t('answerEmote'),correct:correctType==='emote'},{html:t('answerWord'),correct:correctType==='word'}]);
    },

    renderDetective(u){
        const getUserMsgs=name=>{const uo=this.users.get(name);const s=new Set(uo?uo.messages:[]);this.allMessages.forEach(m=>{if(m.name===name&&!s.has(m.text)&&m.text.length>2)s.add(m.text);});return[...s];};
        const multi=Array.from(this.users.keys()).filter(n=>getUserMsgs(n).length>=2);
        if(!multi.length){this.state.currentMode='CLASSIC';this.renderClassic(u);return;}
        const targetName=multi[Math.floor(Math.random()*multi.length)];
        const target=this.users.get(targetName);
        this.setBadge(t('badgeDetective'),'var(--c-accent)');
        const msgs=getUserMsgs(targetName);this.shuffle(msgs);
        const shownMsg=msgs[0];const correctMsg=msgs[1];
        const seen=new Set([shownMsg,correctMsg]);
        const others=[];
        this.allMessages.forEach(m=>{if(m.name!==targetName&&!seen.has(m.text)&&m.text.length>2){seen.add(m.text);others.push(m.text);}});
        Array.from(this.users.values()).forEach(v=>{if(v.name!==targetName&&!seen.has(v.text)&&v.text.length>2){seen.add(v.text);others.push(v.text);}});
        others.sort((a,b)=>Math.abs(a.length-correctMsg.length)-Math.abs(b.length-correctMsg.length));
        const decoys=others.slice(0,Math.min(8,others.length));this.shuffle(decoys);
        document.getElementById('question-area').innerHTML='<div style="font-size:15px;color:var(--c-muted);margin-bottom:8px;">'+t('questionDetective')+'</div><div class="glass2" style="padding:14px 18px;font-size:17px;margin-bottom:8px;">"'+Emotes.parse(shownMsg)+'"</div><div style="font-size:13px;color:var(--c-accent);font-weight:600;">'+t('detectiveHint')+target.name+'</div><div style="font-size:12px;color:var(--c-muted);margin-top:8px;">'+t('questionDetectiveSub')+'</div>';
        const opts=[correctMsg,...decoys.slice(0,3)];this.shuffle(opts);
        this.renderAnswers(opts.map(msg=>({html:'"'+Emotes.parse(msg.substring(0,52))+(msg.length>52?'…':'')+'"',correct:msg===correctMsg})));
    },

    renderGuess7tv(u){
        let pick=null;
        const scan=msg=>{const ws=(msg.text||'').split(/\s+/);for(const w of ws){if(Emotes.is7tv(w))return w;}return null;};
        let found=scan(u);
        if(found){pick={user:u.user,name:u.name,text:u.text,emote:found};}
        else{const pool=[...this.allMessages];this.shuffle(pool);for(const m of pool){const e=scan(m);if(e){const usr=this.users.get(m.name)||{name:m.name,color:'#9ca3af',user:null};pick={user:usr,name:m.name,text:m.text,emote:e};break;}}}
        if(!pick){this.state.currentMode='CLASSIC';this.renderClassic(u);return;}
        this.setBadge(t('badge7tv'),'var(--c-accent2)');
        const shown=pick.text.split(/\s+/).map(w=>w===pick.emote?'<span style="display:inline-flex;width:30px;height:30px;border-radius:7px;background:rgba(255,107,145,.16);border:1px dashed rgba(255,107,145,.5);vertical-align:middle;align-items:center;justify-content:center;font-size:13px;color:var(--c-red);font-weight:800;">?</span>':Emotes.parse(w)).join(' ');
        const all7=[...Emotes.set7tv.keys()].filter(n=>n!==pick.emote);this.shuffle(all7);
        const optNames=this.shuffle([pick.emote,...all7.slice(0,5)]);
        document.getElementById('question-area').innerHTML='<div style="font-size:15px;color:var(--c-muted);margin-bottom:8px;">'+this.nickHtml(pick)+t('writtenBy')+'</div><div class="glass2" style="padding:15px 18px;font-size:18px;margin-bottom:10px;">"'+shown+'"</div><div style="font-size:12px;color:var(--c-muted);">'+t('questionGuess7tv')+'</div>';
        const list=optNames.map(n=>({
            html:'<div style="display:flex;align-items:center;gap:10px;"><img src="'+Emotes.url(n)+'" style="height:38px;flex-shrink:0;"><span style="font-size:13px;color:var(--c-muted);">'+n+'</span></div>',
            correct:n===pick.emote,
            noUrlCopy:true
        }));
        this.renderAnswers(list);
    },

    renderFirstWord(u){
        const words=u.text.trim().split(/\s+/);if(words.length<2){this.state.currentMode='CLASSIC';this.renderClassic(u);return;}
        this.setBadge(t('badgeFirstword'),'var(--c-accent2)');
        const first=words[0];
        if(!this._firstWordTrapCount)this._firstWordTrapCount=0;
        const useTrap=this._firstWordTrapCount<2&&Math.random()<0.05;
        const shown='<span style="color:var(--c-red);font-weight:800;background:rgba(255,107,145,.12);padding:2px 8px;border-radius:6px;">[ ? ]</span> '+words.slice(1).map(w=>Emotes.parse(w)).join(' ');
        document.getElementById('question-area').innerHTML='<div style="margin-bottom:8px;font-size:15px;color:var(--c-muted);">'+this.nickHtml(u)+t('firstwordHint')+'</div><div class="glass2" style="padding:17px 20px;font-size:19px;">"'+shown+'"</div><div style="font-size:11px;color:var(--c-muted);margin-top:8px;">'+t('questionFirstword')+'</div>';
        const allCaps=u.text===u.text.toUpperCase()&&/[a-zа-яё]/i.test(u.text);
        const normCase=w=>Emotes.isEmote(w)?w:(allCaps?w.toUpperCase():w.toLowerCase());
        if(useTrap){
            this._firstWordTrapCount++;
            const firsts=[];
            this.allMessages.forEach(m=>{const fw=m.text.trim().split(/\s+/)[0];if(fw&&fw!==first)firsts.push(fw);});
            Array.from(this.users.values()).forEach(v=>{const fw=v.text.trim().split(/\s+/)[0];if(fw&&fw!==first)firsts.push(fw);});
            this.shuffle(firsts);
            let trapOpts=[...new Set(firsts)].slice(0,3);
            while(trapOpts.length<3){const fw=this.getFakeWord([first,...trapOpts]);if(fw&&!trapOpts.includes(fw))trapOpts.push(fw);else break;}
            trapOpts=trapOpts.map(normCase);this.shuffle(trapOpts);
            const display=trapOpts.map(w=>({html:Emotes.parse(w),correct:false}));
            display.push({html:t('answerNoFirstword'),correct:true,fullWidth:true});
            this.renderAnswers(display);
        }else{
            const opts=[first];
            const firsts=[];
            this.allMessages.forEach(m=>{const fw=m.text.trim().split(/\s+/)[0];if(fw&&fw!==first)firsts.push(fw);});
            Array.from(this.users.values()).forEach(v=>{const fw=v.text.trim().split(/\s+/)[0];if(fw&&fw!==first)firsts.push(fw);});
            this.shuffle(firsts);let i=0;
            while(opts.length<4&&i<firsts.length){if(!opts.includes(firsts[i]))opts.push(firsts[i]);i++;}
            while(opts.length<4){const fw=this.getFakeWord(opts);if(!opts.includes(fw))opts.push(fw);else break;}
            const correctNorm=normCase(first);const display=opts.map(normCase);this.shuffle(display);
            this.renderAnswers(display.map(w=>({html:Emotes.parse(w),correct:w===correctNorm})));
        }
    },

    renderTwoOfFour(u){
        const getUserMsgs=name=>{const uo=this.users.get(name);const s=new Set(uo?uo.messages:[]);this.allMessages.forEach(m=>{if(m.name===name&&!s.has(m.text)&&m.text.length>2)s.add(m.text);});return[...s];};
        const multi=Array.from(this.users.keys()).filter(n=>getUserMsgs(n).length>=2);
        if(!multi.length){this.state.currentMode='CLASSIC';this.renderClassic(u);return;}
        const targetName=multi[Math.floor(Math.random()*multi.length)];
        const target=this.users.get(targetName);
        this.setBadge(t('badge2of4'),'var(--c-green)');
        const tMsgs=getUserMsgs(targetName);this.shuffle(tMsgs);
        const correctTwo=tMsgs.slice(0,2);
        const others=[];const seen=new Set(correctTwo);
        this.allMessages.forEach(m=>{if(m.name!==targetName&&!seen.has(m.text)&&m.text.length>2){seen.add(m.text);others.push(m.text);}});
        Array.from(this.users.values()).forEach(v=>{if(v.name!==targetName&&!seen.has(v.text)&&v.text.length>2){seen.add(v.text);others.push(v.text);}});
        this.shuffle(others);const decoys=others.slice(0,2);
        if(decoys.length<2){this.state.currentMode='CLASSIC';this.renderClassic(u);return;}
        const all=this.shuffle([...correctTwo.map(txt=>({text:txt,correct:true})),...decoys.map(txt=>({text:txt,correct:false}))]);
        document.getElementById('question-area').innerHTML='<div style="font-size:15px;color:var(--c-muted);margin-bottom:8px;">'+t('question2of4pre')+' <b style="color:var(--c-green);">'+t('question2of4msgs')+'</b>'+t('question2of4post')+'</div><div style="font-size:25px;font-weight:800;color:'+(target?.color||'#9ca3af')+';">'+targetName+'</div>';
        this.twoState={picked:[],correctSet:new Set(correctTwo)};
        const grid=document.getElementById('answers-grid');
        grid.style.gridTemplateColumns='1fr';grid.innerHTML='';
        all.forEach(item=>{
            const b=document.createElement('button');b.className='answer-btn';
            b.innerHTML='"'+Emotes.parse(item.text.substring(0,58))+(item.text.length>58?'…':'')+'"';
            b.dataset.text=item.text;b.onclick=()=>this.toggleTwo(b,item.text);
            grid.appendChild(b);
        });
        const sub=document.createElement('button');sub.className='btn-primary';sub.style.cssText='grid-column:1/-1;padding:13px;font-size:14px;margin-top:2px;';
        sub.innerText=t('twoSubmit')+' (0/2)';sub.id='two-submit';sub.onclick=()=>this.checkTwo();
        grid.appendChild(sub);
    },
    toggleTwo(btn,text){
        const p=this.twoState.picked;const idx=p.indexOf(text);
        if(idx>=0){p.splice(idx,1);btn.style.borderColor='';btn.style.background='';}
        else{if(p.length>=2)return;p.push(text);btn.style.borderColor='var(--c-accent)';btn.style.background='rgba(139,125,255,.13)';}
        Sound.click();
        const sub=document.getElementById('two-submit');if(sub)sub.innerText=t('twoSubmit')+' ('+p.length+'/2)';
    },
    checkTwo(){
        if(this.twoState.picked.length!==2)return;
        this.stopPerTimer();
        const correctSet=this.twoState.correctSet;
        const ok=this.twoState.picked.every(txt=>correctSet.has(txt));
        document.querySelectorAll('#answers-grid .answer-btn').forEach(b=>{
            b.disabled=true;const txt=b.dataset.text;
            if(correctSet.has(txt))b.classList.add('correct');
            else if(this.twoState.picked.includes(txt))b.classList.add('wrong');
        });
        const sub=document.getElementById('two-submit');if(sub)sub.disabled=true;
        this.resolveRound(ok);
    },

    renderAnswers(list){
        const grid=document.getElementById('answers-grid');grid.innerHTML='';
        const normal=list.filter(it=>!it.fullWidth);const full=list.filter(it=>it.fullWidth);
        const n=normal.length;
        if(n<=2)grid.style.gridTemplateColumns='1fr';
        else if(n===3)grid.style.gridTemplateColumns='1fr';
        else if(n===6)grid.style.gridTemplateColumns='1fr 1fr 1fr';
        else grid.style.gridTemplateColumns='1fr 1fr';
        const mk=(item,i,fw)=>{
            const b=document.createElement('button');b.className='answer-btn';
            let html=item.html;
            if(!item.noUrlCopy){
                const urlMatch=item.html&&item.html.match(/https?:\/\/[^\s"<>]+/);
                if(urlMatch){
                    const linkUrl=urlMatch[0];const preview=this._makeLinkPreview(linkUrl);const copyBtn=this._makeCopySquareBtn(linkUrl);
                    html=`<div style="display:flex;align-items:center;gap:8px;width:100%;">${html}${copyBtn}</div>${preview?`<div style="margin-top:6px;">${preview}</div>`:''}`;
                }
            }
            b.innerHTML=html;b.dataset.correct=item.correct;
            b.style.animation='fadeUp .3s ease-out both';b.style.animationDelay=(i*0.05)+'s';
            if(fw){b.style.gridColumn='1 / -1';b.style.textAlign='center';}
            b.onclick=(e)=>{this.spawnRipple(b,e);this.handle(b,item.correct);};
            grid.appendChild(b);
        };
        normal.forEach((item,i)=>mk(item,i,false));
        full.forEach((item,i)=>mk(item,n+i,true));
    },

    spawnRipple(btn,e){try{const r=document.createElement('span');r.className='ripple';const rect=btn.getBoundingClientRect();const size=Math.max(rect.width,rect.height);r.style.width=r.style.height=size+'px';r.style.left=((e?e.clientX:rect.left+rect.width/2)-rect.left-size/2)+'px';r.style.top=((e?e.clientY:rect.top+rect.height/2)-rect.top-size/2)+'px';btn.appendChild(r);setTimeout(()=>r.remove(),600);}catch(e){}},

    handle(btn,isCorrect){
        this.stopPerTimer();
        document.querySelectorAll('.answer-btn').forEach(b=>b.disabled=true);
        if(this.state.currentMode==='CENSORED'){const sl=document.getElementById('censored-slot');if(sl)sl.innerHTML='<span class="reveal-glow">'+Emotes.parse(this.state.currentMissingWord)+'</span>';}
        if(isCorrect)btn.classList.add('correct');
        else{btn.classList.add('wrong');document.querySelectorAll('.answer-btn[data-correct="true"]').forEach(b=>b.classList.add('correct'));}
        this.resolveRound(isCorrect);
    },

    resolveRound(isCorrect){
        if(isCorrect){
            Sound.correct(this.state.streak);
            confetti({particleCount:46,spread:65,origin:{y:.6},colors:['#8b7dff','#ff79df','#65d0ff','#52ffb6']});
            this.state.streak++;if(this.state.streak>this.state.bestStreak)this.state.bestStreak=this.state.streak;
            if(this.state.streak>=3)Sound.streak();
            let bonus=this.state.streak>=5?2.5:this.state.streak>=3?1.8:this.state.streak>=2?1.4:1;
            if(this.config.timerPer>0)bonus+=(this.state.timerLeft/this.config.timerPer)*.5;
            this.state.score+=Math.floor(100*bonus);this.state.correct++;this.addHistory(true);
            if(this.state.streak===5)confetti({particleCount:130,spread:110,origin:{y:.5},colors:['#ffd470','#ff79df','#8b7dff']});
        }else{Sound.wrong();this.state.streak=0;this.state.wrong++;this.addHistory(false);}
        this.updateStreakUI();this.updateHeader();this._saveSession();
        setTimeout(()=>this.nextRound(),2400);
    },

    updateStreakUI(){
        const sb=document.getElementById('streak-badge');
        if(this.state.streak>=2){sb.classList.remove('hidden');sb.innerText='x'+this.state.streak+(this.state.streak>=5?' 🔥🔥':this.state.streak>=3?' 🔥':'');sb.style.animation='none';void sb.offsetWidth;sb.style.animation='streakAnim .4s ease-in-out';}
        else sb.classList.add('hidden');
    },

    addHistory(ok){
        const l=document.getElementById('history-list');const modeLabels=t('modeLabels');
        if(!this.state.modeStats)this.state.modeStats={};
        const mk=this.state.currentMode;
        if(!this.state.modeStats[mk])this.state.modeStats[mk]={ok:0,total:0,label:modeLabels[mk]||mk};
        this.state.modeStats[mk].total++;if(ok)this.state.modeStats[mk].ok++;
        const d=document.createElement('div');d.className='history-item '+(ok?'ok':'fail');
        d.innerHTML='<div style="font-size:11px;font-weight:700;color:'+(ok?'var(--c-green)':'var(--c-red)')+'">'+(ok?t('correctHistory'):t('wrongHistory'))+'</div><div style="font-size:10px;color:var(--c-muted);margin-top:2px;">'+(modeLabels[this.state.currentMode]||this.state.currentMode)+' · '+t('roundHistorySuffix')+' '+this.state.round+'</div>';
        l.insertBefore(d,l.firstChild);if(l.children.length>14)l.removeChild(l.lastChild);
    },

    useHint(h){
        if(h==='5050'&&this.state.hints.fifty){const w=Array.from(document.querySelectorAll('.answer-btn[data-correct="false"]:not(:disabled)'));if(w.length<2)return;this.state.hints.fifty=false;document.getElementById('hint-50').classList.add('used');this.shuffle(w);const rc=Math.min(2,w.length-1);w.slice(0,rc).forEach(b=>{b.style.opacity='.14';b.disabled=true;});Sound.click();}
        if(h==='skip'&&this.state.hints.skip){this.state.hints.skip=false;document.getElementById('hint-skip').classList.add('used');this.stopPerTimer();Sound.click();this.nextRound();}
        if(h==='reveal'&&this.state.hints.reveal){this.state.hints.reveal=false;document.getElementById('hint-reveal').classList.add('used');document.querySelectorAll('.answer-btn[data-correct="true"]').forEach(b=>{b.style.boxShadow='0 0 22px rgba(82,255,182,.45)';b.style.borderColor='rgba(82,255,182,.6)';setTimeout(()=>{b.style.boxShadow='';b.style.borderColor='';},1900);});Sound.click();}
    },

    updateHeader(){document.getElementById('round-val').innerText=this.state.round+'/'+this.config.rounds;document.getElementById('score-val').innerText=this.state.score;},

    startFinalRound(){
        const seen=new Set();const byAuthor=new Map();
        const addMsg=(userObj,name,text)=>{if(!text||text.length<2||seen.has(text))return;if(BANNED.some(w=>text.toLowerCase().includes(w)))return;seen.add(text);if(!byAuthor.has(name))byAuthor.set(name,[]);byAuthor.get(name).push({user:userObj,name,text});};
        this.users.forEach(u=>u.messages.forEach(msg=>addMsg(u,u.name,msg)));
        this.allMessages.forEach(m=>{const uo=this.users.get(m.name)||{name:m.name,color:'#9ca3af',messages:[],tags:m.tags};addMsg(uo,m.name,m.text);});
        const authors=[...byAuthor.keys()];if(authors.length<2){this.endGame();return;}
        this.shuffle(authors);
        let pickedAuthors,msgs=[];
        if(authors.length>=4){
            pickedAuthors=authors.slice(0,4);
            pickedAuthors.forEach(n=>{const arr=byAuthor.get(n);msgs.push(arr[Math.floor(Math.random()*arr.length)]);});
            const doubles=this.shuffle(pickedAuthors.filter(n=>byAuthor.get(n).length>=2));
            for(const n of doubles){const used=msgs.filter(m=>m.name===n).map(m=>m.text);const extra=byAuthor.get(n).find(m=>!used.includes(m.text));if(extra){msgs.push(extra);break;}}
        }else{pickedAuthors=authors.slice();const flat=this.shuffle([].concat(...pickedAuthors.map(n=>byAuthor.get(n))));msgs=flat.slice(0,5);}
        this.shuffle(msgs);
        const pnames=this.shuffle([...new Set(msgs.map(m=>m.name))]);
        this.finalData={msgs,pnames};
        document.getElementById('hud').style.display='none';document.getElementById('timer-bar-outer').style.display='none';
        document.getElementById('btn-exit-game').style.display='none';
        this.switchScene('final');this.renderFinalRound();Sound.final();
    },

    renderFinalRound(){
        const{msgs,pnames}=this.finalData;
        const pool=document.getElementById('final-messages-pool');const plist=document.getElementById('final-players-list');
        pool.innerHTML='';plist.innerHTML='';
        msgs.forEach((m,i)=>{
            const card=document.createElement('div');card.className='final-msg-card';card.draggable=true;card.dataset.msgIdx=i;card.dataset.author=m.name;
            const hasUrl=extractUrl(m.text);
            let msgContent='"'+Emotes.parse(m.text.substring(0,56))+(m.text.length>56?'…':'')+'"';
            let copyHtml='';
            if(hasUrl){copyHtml=`<div style="display:flex;align-items:center;gap:6px;margin-top:6px;">${this._makeCopySquareBtn(hasUrl)}<span style="font-size:10px;color:var(--c-blue);">${hasUrl.substring(0,32)}${hasUrl.length>32?'…':''}</span></div>`;const preview=this._makeLinkPreview(hasUrl);if(preview)copyHtml+=preview;}
            card.innerHTML='<div style="font-size:11px;color:var(--c-muted);margin-bottom:4px;">💬 №'+(i+1)+'</div><div style="font-size:13px;">'+msgContent+copyHtml+'</div>';
            card.addEventListener('dragstart',e=>{e.dataTransfer.setData('msgIdx',String(i));card.classList.add('dragging');});
            card.addEventListener('dragend',()=>card.classList.remove('dragging'));
            pool.appendChild(card);
        });
        const moveCard=(idx,destZone)=>{const card=document.querySelector('.final-msg-card[data-msg-idx="'+idx+'"]');if(!card)return;destZone.appendChild(card);document.querySelectorAll('.final-drop-zone').forEach(z=>{const ph=z.querySelector('.fz-placeholder');const hasCard=z.querySelector('.final-msg-card');if(ph)ph.style.display=hasCard?'none':'block';});};
        pnames.forEach(n=>{
            const u=this.users.get(n);const c=u?.color||'#9ca3af';
            const wrap=document.createElement('div');wrap.style.cssText='display:flex;flex-direction:column;gap:4px;margin-bottom:10px;';
            const h=document.createElement('div');h.style.cssText='font-size:13px;font-weight:700;color:'+c+';display:flex;align-items:center;gap:5px;';
            h.innerHTML=this.badges({user:u})+'<span>'+n+'</span>';
            const zone=document.createElement('div');zone.className='final-drop-zone';zone.dataset.player=n;zone.style.cssText='flex-direction:column;gap:6px;align-items:stretch;';
            zone.innerHTML='<span class="fz-placeholder" style="font-size:12px;color:rgba(255,255,255,.22);text-align:center;">'+t('dropHere')+'</span>';
            zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragover');});
            zone.addEventListener('dragleave',()=>zone.classList.remove('dragover'));
            zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragover');const idx=parseInt(e.dataTransfer.getData('msgIdx'));moveCard(idx,zone);});
            wrap.appendChild(h);wrap.appendChild(zone);plist.appendChild(wrap);
        });
        pool.addEventListener('dragover',e=>e.preventDefault());
        pool.addEventListener('drop',e=>{e.preventDefault();const idx=parseInt(e.dataTransfer.getData('msgIdx'));moveCard(idx,pool);});
    },

    checkFinalRound(){
        let ok=0,placed=0;const total=(this.finalData&&this.finalData.msgs.length)||0;
        document.querySelectorAll('.final-drop-zone').forEach(z=>{
            const cards=z.querySelectorAll('.final-msg-card');let zoneAllOk=cards.length>0;
            cards.forEach(c=>{placed++;if(c.dataset.author===z.dataset.player){ok++;c.style.borderColor='var(--c-green)';c.style.background='rgba(82,255,182,.1)';}else{zoneAllOk=false;c.style.borderColor='var(--c-red)';c.style.background='rgba(255,107,145,.1)';}});
            if(cards.length>0){z.style.borderColor=zoneAllOk?'var(--c-green)':'var(--c-red)';z.style.background=zoneAllOk?'rgba(82,255,182,.05)':'rgba(255,107,145,.05)';}
        });
        const allCorrect=ok===total&&placed===total&&total>0;
        const bonus=Math.floor((ok/Math.max(total,1))*300*(allCorrect?2:1));
        this.state.score+=bonus;this.state.finalBonus={ok,total,bonus,allCorrect};
        Sound.final();document.querySelectorAll('#final-actions button').forEach(b=>b.disabled=true);
        if(allCorrect)confetti({particleCount:200,spread:120,origin:{y:.5}});
        setTimeout(()=>this.endGame(),3000);
    },

    endGame(){
        if(this.state.totalIv)clearInterval(this.state.totalIv);
        this.stopPerTimer();this.state.active=false;
        document.getElementById('hud').style.display='none';document.getElementById('timer-bar-outer').style.display='none';
        document.getElementById('history-panel').style.display='none';document.getElementById('live-events').style.display='none';
        document.getElementById('btn-exit-game').style.display='none';
        this.switchScene('result');
        const c=this.state.correct,w=this.state.wrong,tot=c+w;
        const pct=tot>0?Math.round(c/tot*100):0;
        const chn=this._connectedChannel||document.getElementById('channel-input').value.trim();
        document.getElementById('result-channel-name').innerText=chn?(t('channel')+': '+chn):t('result');
        const scoreEl=document.getElementById('final-score');const targetScore=this.state.score;
        let cur=0;const step=Math.max(1,Math.round(targetScore/40));
        const ci=setInterval(()=>{cur+=step;if(cur>=targetScore){cur=targetScore;clearInterval(ci);}scoreEl.innerText=cur;},22);
        const rankMsgs=t('rankMsg'),rankEmojis=t('rankEmoji');let ri=0;
        if(pct>=90)ri=4;else if(pct>=75)ri=3;else if(pct>=55)ri=2;else if(pct>=35)ri=1;
        const rankCls=ri>=3?(ri===4?'grad-text-gold':'grad-text'):'';
        document.getElementById('result-rank-emoji').innerText=rankEmojis[ri];
        document.getElementById('final-msg').innerHTML='<span class="'+rankCls+'">'+rankMsgs[ri]+'</span>';
        const circ=327,correctFrac=tot>0?c/tot:0;
        setTimeout(()=>{document.getElementById('result-donut-wrong').style.strokeDashoffset=0;document.getElementById('result-donut-correct').style.strokeDashoffset=circ-(circ*correctFrac);},120);
        document.getElementById('result-accuracy').innerText=pct+'%';
        document.getElementById('result-legend-correct').innerText=t('correctLabel')+' '+c;
        document.getElementById('result-legend-wrong').innerText=t('wrongLabel')+' '+w;
        const finalB=this.state.finalBonus;
        const statRow=(label,val,color)=>'<div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:12px;color:var(--c-muted);">'+label+'</span><span class="font-display" style="font-size:15px;font-weight:700;color:'+(color||'var(--c-text)')+';">'+val+'</span></div>';
        let statsHtml=statRow(t('roundsPlayed'),tot,'var(--c-text)')+statRow(t('bestStreak'),'x'+this.state.bestStreak,this.state.bestStreak>=3?'var(--c-gold)':'var(--c-text)')+statRow(t('accuracyLabel'),pct+'%',pct>=70?'var(--c-green)':pct>=40?'var(--c-gold)':'var(--c-red)');
        if(finalB)statsHtml+=statRow(t('finalCorrect'),finalB.ok+'/'+finalB.total,finalB.allCorrect?'var(--c-green)':'var(--c-muted)')+statRow(t('finalBonus'),'+'+finalB.bonus,'var(--c-accent2)');
        document.getElementById('final-stats').innerHTML=statsHtml;
        const ms=this.state.modeStats||{},modeLabels=t('modeLabels');
        const modeKeys=Object.keys(ms).sort((a,b)=>(ms[b].ok/ms[b].total)-(ms[a].ok/ms[a].total));
        const barsEl=document.getElementById('result-mode-bars');
        if(modeKeys.length){barsEl.innerHTML=modeKeys.map(k=>{const m=ms[k];const p=Math.round(m.ok/m.total*100);const col=p>=70?'var(--c-green)':p>=40?'var(--c-gold)':'var(--c-red)';return'<div><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;"><span style="color:var(--c-muted);">'+(modeLabels[k]||k)+'</span><span style="color:'+col+';font-weight:700;">'+m.ok+'/'+m.total+'</span></div><div style="height:7px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;"><div style="height:100%;width:'+p+'%;background:'+col+';border-radius:6px;transition:width .8s cubic-bezier(0.16,1,0.3,1);"></div></div></div>';}).join('');}
        else{barsEl.innerHTML='<div style="font-size:12px;color:var(--c-muted);text-align:center;padding:8px;">'+t('noModesData')+'</div>';}
        this.saveHistory();this.renderResultHistory();
        confetti({particleCount:pct>=70?190:90,spread:105,origin:{y:.6},colors:['#8b7dff','#ff79df','#ffd470','#65d0ff']});Sound.go();
        Storage.clear(Storage.KEYS.session);
    },

    renderResultHistory(){
        let h=[];try{h=Storage.load(Storage.KEYS.history,[]);}catch(e){}
        const block=document.getElementById('result-history-block');const chart=document.getElementById('result-history-chart');
        if(!h.length){block.style.display='none';return;}block.style.display='block';
        const recent=h.slice(0,12).reverse();const max=Math.max(...recent.map(x=>x.score),1);const best=Math.max(...h.map(x=>x.score));
        document.getElementById('result-history-best').innerText=t('recordLabel')+' '+best;
        chart.innerHTML=recent.map((x,i)=>{const ph=Math.max(6,Math.round(x.score/max*100));const isLast=i===recent.length-1;const col=isLast?'linear-gradient(180deg,var(--c-accent2),var(--c-accent))':'rgba(139,125,255,0.32)';return'<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;" title="'+x.score+'"><div style="width:100%;background:'+col+';border-radius:4px 4px 2px 2px;height:'+ph+'%;min-height:6px;transition:height .7s cubic-bezier(0.16,1,0.3,1);"></div>'+(isLast?'<div style="font-size:8px;color:var(--c-accent2);font-weight:700;">'+t('currentLabel')+'</div>':'')+'</div>';}).join('');
    },

    goHome(){Sound.click();Storage.clear(Storage.KEYS.session);location.reload();},
    playAgain(){Sound.click();Storage.clear(Storage.KEYS.session);location.reload();},

    saveHistory(){
        try{
            const h=Storage.load(Storage.KEYS.history,[]);
            const ch=this._connectedChannel||'';
            h.unshift({score:this.state.score,correct:this.state.correct,wrong:this.state.wrong,date:new Date().toLocaleString('ru'),channel:ch});
            Storage.save(Storage.KEYS.history,h.slice(0,20));
        }catch(e){}
    },

    switchScene(id){
        ['login','loading','warning-pre','warning','game','final','result'].forEach(s=>{const el=document.getElementById('scene-'+s);if(el)el.classList.add('hidden');});
        const tgt=document.getElementById('scene-'+id);
        if(tgt){tgt.classList.remove('hidden');tgt.style.animation='none';void tgt.offsetWidth;tgt.style.animation='fadeUp .5s cubic-bezier(0.16,1,0.3,1)';}
        const actionScenes=['login','loading','warning-pre','final','result'];
        actionScenes.forEach(s=>{const el=document.getElementById('scene-'+s+'-actions')||document.getElementById(s+'-actions');if(el)el.classList.toggle('hidden',s!==id);});
        const sb=document.getElementById('btn-settings');
        if(sb)sb.style.display=(id==='login'||id==='warning-pre')?'flex':'none';
        const topCtrl=document.getElementById('top-controls');
        if(topCtrl)topCtrl.style.display=(id==='game'||id==='final')?'none':'flex';
    }
};

(function(){
    const cv=document.getElementById('cursor-canvas');if(!cv)return;
    const ctx=cv.getContext('2d');let W,H;
    function resize(){W=cv.width=window.innerWidth;H=cv.height=window.innerHeight;}
    window.addEventListener('resize',resize);resize();
    const pts=[];let mx=-100,my=-100,hasMouse=false;
    window.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;hasMouse=true;});
    window.addEventListener('mouseout',()=>{hasMouse=false;});
    let hue=262;
    function frame(){
        ctx.clearRect(0,0,W,H);
        if(hasMouse){pts.push({x:mx,y:my,life:1,hue:hue});hue=(hue+2)%360;}
        while(pts.length>22)pts.shift();
        if(pts.length>1){for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];const tval=i/pts.length;ctx.strokeStyle='hsla('+b.hue+',85%,72%,'+(tval*0.5*b.life)+')';ctx.lineWidth=tval*3.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
        pts.forEach((p,i)=>{p.life-=0.045;const tval=i/pts.length;if(p.life>0){ctx.fillStyle='hsla('+p.hue+',90%,78%,'+(p.life*tval*0.7)+')';ctx.beginPath();ctx.arc(p.x,p.y,tval*2.4*p.life,0,Math.PI*2);ctx.fill();}});
        if(hasMouse){const g=ctx.createRadialGradient(mx,my,0,mx,my,16);g.addColorStop(0,'hsla('+hue+',90%,80%,0.4)');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.beginPath();ctx.arc(mx,my,16,0,Math.PI*2);ctx.fill();}
        requestAnimationFrame(frame);
    }
    frame();
})();

(function(){
    app.loadSettings();
    applyLang();
    const sl=document.getElementById('users-slider');if(sl)app.updateSlider(sl);
    const ci=document.getElementById('channel-input');if(ci)ci.addEventListener('keydown',e=>{if(e.key==='Enter')app.connect();});
    document.addEventListener('keydown',e=>{
        if(e.key!=='Escape')return;
        const rm=document.getElementById('rules-modal');const fm=document.getElementById('faq-modal');const sp=document.getElementById('settings-panel');
        if(rm&&!rm.classList.contains('hidden'))app.closeRules();
        else if(fm&&!fm.classList.contains('hidden'))app.closeFaq();
        else if(sp&&sp.classList.contains('open'))app.closeSettings();
    });
    try{
        const h=Storage.load(Storage.KEYS.history,[]);
        if(h.length){const p=document.getElementById('history-panel');if(p)p.style.display='block';document.getElementById('history-panel-title').innerText=t('historyTitle');document.getElementById('history-list').innerHTML=h.map(x=>'<div class="history-item ok"><div style="font-size:12px;font-weight:800;color:var(--c-accent);">'+x.score+' '+t('answerRound')+'</div><div style="font-size:10px;color:var(--c-muted);">✅'+x.correct+' ❌'+x.wrong+' — '+x.date+'</div></div>').join('');}
    }catch(e){}
    const msgFilterInputs=document.querySelectorAll('input[name="msgfilter"]');
    msgFilterInputs.forEach(inp=>{inp.addEventListener('change',()=>{msgFilterInputs.forEach(i=>{i.closest('.msg-filter-tab').classList.toggle('active',i.checked);});});});
})();
