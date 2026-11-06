'use strict';
(function(SD){
 SD.Save.load();
 SD.RigImporter.loadEmbedded();
 SD.Input.init();
 const g=new SD.Game(document.getElementById('game'));
 SD.Audio.setVol(SD.Save.data.settings.master,SD.Save.data.settings.sfx);
 const last=SD.Save.data.last;if(last)try{Object.assign(g.cfg,last)}catch(e){}
 SD.UI.init(g);
 window.__sd=g;
 g.arena=new SD.Arena(g.cfg.arena,g,{destruct:false});g.camSnap=true;requestAnimationFrame(t=>g.frame(t));
})(window.SD);
