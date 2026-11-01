(function(root){
 'use strict';
 const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const date=s=>new Date(s+'T12:00:00');
 const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const plus=(s,n)=>{const d=date(s);d.setDate(d.getDate()+n);return iso(d)};
 const minutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
 const time=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 function occurs(x,d){return d>=x.date&&(!x.until||d<=x.until)&&!x.excluded.includes(d)&&(x.days.length?x.days.includes(date(d).getDay()):d===x.date)}
 function busyMinutes(list){const spans=list.map(x=>[minutes(x.start),minutes(x.end)]).sort((a,b)=>a[0]-b[0]);let end=0,total=0;for(const [s,e] of spans){total+=Math.max(0,e-Math.max(s,end));end=Math.max(end,e)}return total}
 function conflicts(list){return list.some((a,i)=>list.slice(i+1).some(b=>minutes(a.start)<minutes(b.end)&&minutes(b.start)<minutes(a.end)))}
 function load(all,begin){return Array.from({length:7},(_,i)=>{const d=plus(begin,i),list=all.filter(x=>occurs(x,d)&&!x.done.includes(d));return {date:d,minutes:busyMinutes(list),overlap:conflicts(list),tasks:list.filter(x=>x.kind==='task').length}})}
 function free(all,prefs,begin,duration=30,now=new Date()){
  for(let i=0;i<7;i++){const d=plus(begin,i),list=all.filter(x=>occurs(x,d));if(busyMinutes(list)>=600)continue;
   let start=minutes(prefs.start);if(d===iso(now))start=Math.max(start,Math.ceil((now.getHours()*60+now.getMinutes())/15)*15);
   for(let t=start;t+duration<=minutes(prefs.end);t+=15){if(!list.some(x=>t<minutes(x.end)+prefs.pause&&t+duration>minutes(x.start)-prefs.pause))return {date:d,start:time(t),end:time(t+duration)}}
  }return null;
 }
 function parseMessage(raw,today){
  const text=String(raw).trim(),n=norm(text),tomorrow=plus(today,1);
  const range=n.match(/(?:das?|de|\bas)\s*(\d{1,2})(?::(\d{2})|h(\d{2})?)?\s*(?:as|ate|a|-)\s*(\d{1,2})(?::(\d{2})|h(\d{2})?)?\b/);
  if(range&&/trabalh|adicion|agend|marc|cadastr|cria|tenho/.test(n)){
   const start=time(Number(range[1])*60+Number(range[2]||range[3]||0)),end=time(Number(range[4])*60+Number(range[5]||range[6]||0));
   if(Number(range[1])>23||Number(range[4])>23||Number(range[2]||range[3]||0)>59||Number(range[5]||range[6]||0)>59||minutes(end)<=minutes(start))return {kind:'help',text:'Confira os horários, chefe. O fim precisa ser depois do início, no mesmo dia.'};
   const recurring=/segunda\s*(?:a|ate)\s*sexta/.test(n);
   let d=/amanha/.test(n)?tomorrow:today;const explicit=n.match(/\b(\d{2})\/(\d{2})(?:\/(\d{4}))?\b/);
   if(explicit){d=`${explicit[3]||today.slice(0,4)}-${explicit[2]}-${explicit[1]}`;if(iso(date(d))!==d)return {kind:'help',text:'Essa data não existe, chefe. Use dia/mês/ano.'}}
   if(!recurring&&!/hoje|amanha/.test(n)&&!explicit)return {kind:'help',text:'Diga também o dia, chefe. Por exemplo: “Adicionar dentista amanhã das 14 às 15”.'};
   let title=text.slice(0,range.index).replace(/^(?:nilo[,!]?\s*)?(?:(?:adicion(?:ar|e|a)|agend(?:ar|e|a)|marc(?:ar|a|que)|cadastr(?:ar|e|a)|cria(?:r)?|tenho)\s+(?:uma?\s+)?)/i,'').replace(/\b(?:hoje|amanhã|amanha|de segunda a sexta|segunda a sexta|todos os dias)(?=\s|$)/gi,'').replace(/\b\d{2}\/\d{2}(?:\/\d{4})?\b/g,'').trim();
   if(/trabalh/.test(n))title='Trabalho';if(!title||title.length>120)return {kind:'help',text:'Inclua um nome de até 120 caracteres para esse plano, chefe.'};
   if(/todo|repet|seman|segunda|terca|quarta|quinta|sexta|sabado|domingo/.test(n)&&!recurring)return {kind:'help',text:'Para repetir uma rotina, use “de segunda a sexta” ou abra Rotinas e escolha os dias. Não vou adivinhar essa repetição.'};
   return {kind:'proposal',item:{title,kind:/tarefa|estud|ler |leitura|caminh|trein/.test(n)?'task':'event',date:d,start,end,days:recurring?[1,2,3,4,5]:[],until:'',priority:/prioridade alta/.test(n)?'Alta':'Normal',excluded:[],done:[]}};
  }
  if(/passos|divid|quebrar|subtaref/.test(n))return {kind:'steps'};
  if(/calendario|iphone|lembrete|notifica/.test(n))return {kind:'iphone'};
  if(/equilibr|sobrecar|dia.*chei|redistrib/.test(n))return {kind:'balance'};
  if(/planej|organiz.*semana/.test(n))return {kind:'plan'};
  if(/semana/.test(n))return {kind:'week'};
  if(/livre|encaix|tempo|horario/.test(n))return {kind:'free'};
  if(/amanha/.test(n))return {kind:'day',date:tomorrow};
  if(/hoje|meu dia|agenda|fazer|compromisso|pendenc/.test(n))return {kind:'day',date:today};
  return {kind:'help',text:'Estou aqui, chefe. Posso consultar hoje ou amanhã, mostrar sua semana, procurar tempo livre e preparar planos. Experimente “Trabalho de segunda a sexta das 6 às 18”. Para outros assuntos, esta versão local ainda não tem uma IA de conversa geral.'};
 }
 function suggestSteps(title){const n=norm(title);if(/estud|curso|prova|aprender/.test(n))return ['Separar o material e escolher um tópico','Estudar o tópico por 25 minutos','Fazer um exercício e anotar a próxima dúvida'];if(/limp|arrum|organiz/.test(n))return ['Escolher uma área pequena para começar','Separar o que fica e o que sai','Organizar essa área e escolher a próxima'];if(/projeto|site|app|desenvolv/.test(n))return ['Definir uma entrega pequena e clara','Executar a primeira parte por 25 minutos','Conferir o resultado e anotar o próximo passo'];return ['Definir o resultado que quero alcançar','Separar o necessário para começar','Fazer a primeira parte por 25 minutos','Revisar e escolher o próximo passo']}
 const icsEscape=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 function fold(line){let out='',part='',size=0;for(const ch of line){const bytes=new TextEncoder().encode(ch).length;if(size+bytes>75){out+=part+'\r\n';part=' ';size=1}part+=ch;size+=bytes}return out+part}
 const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 function calendar(all,begin,days,alarm=15,now=new Date()){
  if(!Number.isInteger(days)||days<1||days>90||![0,5,15,30,60].includes(alarm))throw Error('Período ou lembrete inválido');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nilo Pessoal//Agenda local//PT-BR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Nilo'];let count=0;
  for(let i=0;i<days;i++){const d=plus(begin,i);for(const x of all.filter(x=>occurs(x,d)&&!x.done.includes(d))){const start=new Date(d+'T'+x.start+':00'),end=new Date(d+'T'+x.end+':00');if(end<=now)continue;
   lines.push('BEGIN:VEVENT','UID:'+icsEscape(x.id+'-'+d)+'@nilo-pessoal','DTSTAMP:'+stamp(now),'DTSTART:'+stamp(start),'DTEND:'+stamp(end),'SUMMARY:'+icsEscape(x.title),'DESCRIPTION:'+icsEscape('Exportado do Nilo. Mudanças no Nilo não atualizam esta cópia no Calendário.'+(x.steps?.length?'\nPassos:\n'+x.steps.map(s=>(s.done?'✓ ':'• ')+s.text).join('\n'):'')));
   if(alarm)lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEscape(x.title),'TRIGGER:-PT'+alarm+'M','END:VALARM');lines.push('END:VEVENT');count++;
  }}lines.push('END:VCALENDAR');return {count,text:lines.map(fold).join('\r\n')+'\r\n'};
 }
 const api={norm,plus,load,free,parseMessage,suggestSteps,calendar,busyMinutes,conflicts,occurs};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NiloCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
