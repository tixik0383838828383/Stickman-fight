'use strict';
// RigImporter: reads Stick Nodes ".nodes" binary rigs (big-endian).
// Layout reverse-engineered from the supplied files: 96-byte header, then N fixed 84-byte node records
// (pre-order tree: child count first), 8 trailing bytes. Colours are stored ABGR.
(function(SD){
const abgr=(b,o)=>{const a=b[o],B=b[o+1],G=b[o+2],R=b[o+3];return {a:a,hex:SD.U.rgb2hex(R,G,B)}};
const R=SD.RigImporter={
 parse(buf){
  const u8=buf instanceof Uint8Array?buf:new Uint8Array(buf);const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  const warn=[];if(u8.length<104)return {ok:false,error:'file too small'};
  const version=dv.getInt32(0),hdrCount=dv.getInt32(4),scale=dv.getFloat32(8);
  const color=abgr(u8,12).hex,bg=abgr(u8,16).hex;
  const n=Math.floor((u8.length-96-8)/84);if((u8.length-104)%84)warn.push('size not multiple of 84');
  const nodes=[];
  for(let i=0;i<n;i++){const o=96+i*84;
   nodes.push({cnt:dv.getInt32(o),type:u8[o+4],id:dv.getInt32(o+5),flags:Array.from(u8.slice(o+9,o+18)),dx:dv.getFloat32(o+18),dy:dv.getFloat32(o+22),len:dv.getFloat32(o+30),thick:dv.getInt32(o+38),color:abgr(u8,o+72).hex,edge:abgr(u8,o+76).hex})}
  // rebuild pre-order tree
  let pos=0,maxDepth=0,overflow=false;const roots=[];
  const walk=(depth,parent)=>{if(pos>=nodes.length){overflow=true;return null}const nd=nodes[pos++];nd.parent=parent;nd.children=[];maxDepth=Math.max(maxDepth,depth);for(let k=0;k<nd.cnt;k++){const c=walk(depth+1,nd.id);if(c)nd.children.push(c)}return nd};
  const root=walk(0,null);const treeOk=!overflow&&pos===nodes.length;if(!treeOk)warn.push('child-count tree is only approximate');
  const cols={};nodes.forEach(nd=>cols[nd.color]=(cols[nd.color]||0)+1);
  const base='#1f1f1f';const accents=Object.keys(cols).filter(c=>c!==base);
  accents.sort((a,b)=>cols[b]-cols[a]);
  return {ok:true,treeOk,version,hdrCount,scale,color,bg,nodeCount:nodes.length,maxDepth,nodes,root,accents,accentCount:accents.reduce((s,c)=>s+cols[c],0),warnings:warn,
   leaves:nodes.filter(x=>x.cnt===0).length,bytes:u8.length};
 },
 fromBase64(b64){const s=atob(b64),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return R.parse(u)},
 loadEmbedded(){const out={};for(const k in SD.RIGDATA){out[k]=R.fromBase64(SD.RIGDATA[k])}R.rigs=out;return out},
 rigs:{},
 byName(n){return R.rigs[n+' SF.nodes']||R.rigs[n]},
 // Turn an imported rig into a roster-ready profile (colour, accent colour, extra-node complexity)
 toProfile(rig,name){const extra=Math.max(0,rig.nodeCount-17);return {name,color:rig.color==='#000000'?'#222222':rig.color,rawColor:rig.color,accent:rig.accents.find(a=>a!=='#000000')||null,extraNodes:extra,nodes:rig.nodeCount}},
 // dialog to import user .nodes files at runtime (character or weapon)
 importFile(file,cb){const fr=new FileReader();fr.onload=()=>{const rig=R.parse(fr.result);if(!rig.ok)return cb(rig);cb(null,rig,file.name.replace(/\.nodes$/i,'').replace(/ SF$/,''))};fr.readAsArrayBuffer(file)}
};
})(window.SD);
