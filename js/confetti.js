window.confetti=(function(){
    var cvs,ctx;
    function init(){
        if(cvs)return;
        cvs=document.createElement('canvas');
        cvs.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
        document.body.appendChild(cvs);
        ctx=cvs.getContext('2d');
        cvs.width=window.innerWidth;
        cvs.height=window.innerHeight;
        window.addEventListener('resize',()=>{cvs.width=window.innerWidth;cvs.height=window.innerHeight;});
    }
    function rand(a,b){return Math.random()*(b-a)+a;}
    return function(opts){
        opts=opts||{};
        init();
        var count=opts.particleCount||60,
            colors=opts.colors||['#7c6fff','#ff6fd8','#ffd166','#5bc8ff'],
            parts=[],
            shapes=['rect','circle'];
        for(var i=0;i<count;i++){
            parts.push({
                x:cvs.width*(opts.origin?opts.origin.x||.5:.5),
                y:cvs.height*(opts.origin?opts.origin.y||.5:.5),
                vx:rand(-8,8)*(opts.spread||60)/60,
                vy:rand(-15,-4),
                color:colors[i%colors.length],
                r:rand(4,9),rot:rand(0,360),vrot:rand(-6,6),
                alpha:1,shape:shapes[i%shapes.length]
            });
        }
        function frame(){
            ctx.clearRect(0,0,cvs.width,cvs.height);
            var alive=false;
            parts.forEach(p=>{
                p.x+=p.vx;p.y+=p.vy;p.vy+=0.32;p.vx*=0.99;p.rot+=p.vrot;p.alpha-=0.016;
                if(p.alpha>0){
                    alive=true;
                    ctx.save();
                    ctx.globalAlpha=Math.max(0,p.alpha);
                    ctx.fillStyle=p.color;
                    ctx.translate(p.x,p.y);
                    ctx.rotate(p.rot*Math.PI/180);
                    if(p.shape==='circle'){ctx.beginPath();ctx.arc(0,0,p.r/1.6,0,Math.PI*2);ctx.fill();}
                    else ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*.55);
                    ctx.restore();
                }
            });
            if(alive)requestAnimationFrame(frame);
            else ctx.clearRect(0,0,cvs.width,cvs.height);
        }
        frame();
    };
})();
