(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OpenFHSAvatars=api;})(globalThis,()=>{
 const coats={sage:'#9db399',ginger:'#cc9469',charcoal:'#73777b',cream:'#e6d6b3',black:'#292c30',white:'#f4f0e6',chocolate:'#765747',cinnamon:'#ad7450',bluegrey:'#82909f',silver:'#b9bec3',lilac:'#b6a0b1',rose:'#d5a2a0'};
 const eyes={green:'#678346',blue:'#639dcc',amber:'#c68c31',gold:'#d3b249',copper:'#b36d3c',hazel:'#96904a',aqua:'#67b8af',ice:'#bddcea',brown:'#7e6446',olive:'#859465',violet:'#9b82ba'};
 const pupils={black:'#18201f',brown:'#49382d',slate:'#414d61'};
 const patterns=['solid','tuxedo','siamese','tabby','calico','tortoiseshell','bicolor'];
 const presets={classic:{coat:'sage',fur:'short',pattern:'solid',eyes:'green'},black:{coat:'black',fur:'short',pattern:'solid',eyes:'gold'},tuxedo:{coat:'black',fur:'short',pattern:'tuxedo',eyes:'green'},siamese:{coat:'cream',fur:'short',pattern:'siamese',eyes:'blue'},sphynx:{coat:'rose',fur:'hairless',pattern:'solid',eyes:'aqua'},tabby:{coat:'ginger',fur:'short',pattern:'tabby',eyes:'amber'},calico:{coat:'white',fur:'long',pattern:'calico',eyes:'copper'},tortie:{coat:'black',fur:'short',pattern:'tortoiseshell',eyes:'hazel'},white:{coat:'white',fur:'long',pattern:'solid',eyes:'ice'}};
 function normalize(value={}){const result={};for(const [key,allowed,fallback] of [['coat',Object.keys(coats),'sage'],['eyes',Object.keys(eyes),'green'],['rightEye',Object.keys(eyes),'green'],['pupil',Object.keys(pupils),'black'],['pattern',patterns,'solid'],['fur',['short','long','hairless'],'short']]){const v=value[key]||(key==='rightEye'?value.eyes:undefined)||fallback;if(!allowed.includes(v))throw Error('Choose a valid avatar '+(key==='coat'?'coat color':key)+'.');result[key]=v;}return result;}
 function pixel(value={}){
 const v=normalize(value),c=coats[v.coat],p=pupils[v.pupil];
 let marking='';
 const rect=(x,y,w,h,fill)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'"/>';
 if(['tuxedo','bicolor'].includes(v.pattern))marking='<path d="M55 50h10v15h10v15h10v15H35V80h10V65h10Z" fill="#f4f0e6"/>';
 if(v.pattern==='siamese')marking=rect(30,45,60,40,'#765747')+rect(20,20,15,20,'#765747')+rect(85,20,15,20,'#765747');
 if(v.pattern==='tabby')marking=rect(45,35,5,15,'#765747')+rect(58,35,5,20,'#765747')+rect(70,35,5,15,'#765747');
 if(['calico','tortoiseshell'].includes(v.pattern))marking=rect(25,35,25,30,'#c48654')+rect(75,40,20,30,v.pattern==='calico'?'#42403e':'#a9754c');
 if(v.fur==='hairless')marking+=rect(45,43,30,3,'#af7d7a')+rect(50,48,20,3,'#af7d7a');
 const fur=v.fur==='long'?'<path d="M15 60H5v10h10v10H5v10h20v10h70V90h20V80h-10V70h10V60H95" fill="'+c+'"/>':'';
 return '<svg class="profile-avatar pixel-avatar" viewBox="0 0 120 120" role="img" aria-label="Illustrated cat avatar" shape-rendering="crispEdges"><rect class="avatar-backdrop" x="5" y="5" width="110" height="110" fill="#e7eee0"/>'+fur+'<path d="M20 15h15v10h10v10h30V25h10V15h15v70H90v15H30V85H20Z" fill="'+c+'"/>'+marking+rect(25,25,10,15,'#e7bba9')+rect(85,25,10,15,'#e7bba9')+'<g class="avatar-iris">'+rect(30,60,15,15,eyes[v.eyes])+rect(75,60,15,15,eyes[v.rightEye])+'</g><g class="avatar-pupil">'+rect(35,60,5,15,p)+rect(80,60,5,15,p)+'</g>'+rect(55,80,10,5,'#bb8583')+'<path d="M60 85v5H45m15 0h15" fill="none" stroke="'+p+'" stroke-width="3"/></svg>';
 }
 function svg(value={}){
  const v=normalize(value),c=coats[v.coat],e=eyes[v.eyes],r=eyes[v.rightEye],p=pupils[v.pupil];
  const path=v.fur==='long'?'M16 60L6 72L16 80L10 90L28 96Q60 114 92 96L110 90L104 80L114 72L104 60L102 10L80 29Q60 20 40 29L18 10Z':'M16 66L18 10L40 29Q60 20 80 29L102 10L104 66Q102 104 60 106Q18 104 16 66';
  let marking='';
  if(['tuxedo','bicolor'].includes(v.pattern))marking='<path d="M60 44Q49 69 34 85Q60 112 86 85Q70 66 60 44" fill="#f4f0e6"/>';
  if(v.pattern==='siamese')marking='<path d="M18 10L40 29L23 43M102 10L80 29L97 43" fill="#765747"/><ellipse cx="60" cy="69" rx="30" ry="27" fill="#765747"/>';
  if(v.pattern==='tabby')marking='<path d="M45 28L50 44L60 33L70 44L75 28M20 57L31 61M19 73L31 74M100 57L89 61M101 73L89 74" fill="none" stroke="#765747" stroke-width="5"/>';
  if(['calico','tortoiseshell'].includes(v.pattern))marking='<path d="M25 43Q18 28 39 30Q65 26 53 56Q35 83 25 60Z" fill="#c48654"/><path d="M72 34Q98 25 99 49Q99 69 80 61Q66 58 72 34" fill="'+(v.pattern==='calico'?'#42403e':'#a9754c')+'"/>';
  if(v.fur==='hairless')marking+='<path d="M48 38Q60 32 72 38M48 43Q60 38 72 43" stroke="#af7d7a" stroke-width="1.5" fill="none"/>';
  return `<svg class="profile-avatar" viewBox="0 0 120 120" role="img" aria-label="Illustrated cat avatar"><circle cx="60" cy="60" r="59" fill="#e7eee0"/><g transform="translate(0 1)"><path d="${path}" fill="${c}"/>${marking}<path d="M24 23L28 43L37 33M96 23L92 43L83 33" fill="#e7bba9"/><ellipse class="avatar-iris" cx="40" cy="62" rx="11" ry="9" fill="${e}"/><ellipse class="avatar-iris" cx="80" cy="62" rx="11" ry="9" fill="${r}"/><ellipse class="avatar-pupil" cx="40" cy="62" rx="3" ry="7" fill="${p}"/><ellipse class="avatar-pupil" cx="80" cy="62" rx="3" ry="7" fill="${p}"/><circle class="avatar-glint" cx="37" cy="59" r="2" fill="white"/><circle class="avatar-glint" cx="77" cy="59" r="2" fill="white"/><path d="M54 79L66 79L60 85Z" fill="#bb8583"/><path d="M60 85Q52 93 46 87M60 85Q68 93 74 87" fill="none" stroke="#66524e" stroke-width="2"/></g></svg>`;
 }
 return {coats,eyes,pupils,patterns,presets,normalize,svg,pixel};
});
