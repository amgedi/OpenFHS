const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function harness(text){
 const parent={closest:()=>false};
 const node={textContent:text,parentElement:parent};
 const banner={};
 const document={documentElement:{},body:{},querySelectorAll:()=>[],querySelector:()=>banner,createTreeWalker:()=>{let done=false;return {nextNode:()=>done?null:(done=true,node)};}};
 const context={window:{},document,NodeFilter:{SHOW_TEXT:4}};
 vm.runInNewContext(fs.readFileSync('prototype/languages.js','utf8'),context);
 return {apply:context.window.OpenFHSLanguages.apply,node,document};
}
test('language switching preserves source wording and distinguishes changing guided controls',()=>{
 const h=harness('Next question →');h.apply('es');assert.equal(h.node.textContent,'Siguiente pregunta →');
 h.apply('fr');assert.equal(h.node.textContent,'Question suivante →');
 h.node.textContent='Review answers →';h.apply('fr');assert.equal(h.node.textContent,'Vérifier les réponses →');
 h.apply('en');assert.equal(h.node.textContent,'Review answers →');
});
test('all priority languages translate support navigation and Arabic sets reading direction',()=>{
 const h=harness('Help & support');
 for(const code of ['es','fr','zh','ar','tr']){h.apply(code);assert.notEqual(h.node.textContent,'Help & support');assert.equal(h.document.documentElement.lang,code);assert.equal(h.document.documentElement.dir,code==='ar'?'rtl':'ltr');}
 h.apply('en');assert.equal(h.node.textContent,'Help & support');
});

test('new privacy, scenery and timezone controls have entries in every priority language',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync('prototype/languages.js','utf8'),context);
 const L=context.window.OpenFHSLanguages;
 const labels=['Public username','Choose platforms for this username','Add selected accounts','Pixel meadow (8-bit)','A quiet moment with your cat','Close scenic view','Main navigation','Female','Male','Save preferences','Review your cat’s starting information'];
 for(const language of ['es','fr','zh','ar','tr'])for(const label of labels)assert.ok(L.hasTranslation(label,language),language+': '+label);
 assert.equal(L.translate('Female','en'),'Female');assert.equal(L.translate('Male','en'),'Male');
});

test('translation catalogue has six nonempty columns for every entry',()=>{
 const context={window:{}};
 vm.runInNewContext(fs.readFileSync('prototype/languages.js','utf8').replace('return {apply,translate,date,hasTranslation};','return {apply,translate,date,hasTranslation,rows};'),context);
 for(const row of context.window.OpenFHSLanguages.rows){assert.equal(row.length,6,row[0]);for(const cell of row)assert.ok(typeof cell==='string'&&cell.trim(),row[0]);}
});
