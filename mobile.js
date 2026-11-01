function dailySummary(date=today(), now=new Date()) {
  const list=entries(date), tasks=list.filter(x=>x.kind==='task'&&!x.done.includes(date)), events=list.filter(x=>x.kind==='event');
  const pending=items.filter(x=>x.kind==='task'&&!x.days.length&&x.date<date&&!x.done.includes(x.date)&&!x.excluded.includes(x.date)).sort((a,b)=>a.date.localeCompare(b.date));
  let lines=['Chefe, este é seu resumo de hoje.'];
  if(events.length)lines.push('Compromissos:',...events.map(x=>`${x.start} às ${x.end}: ${x.title}.`));
  if(tasks.length)lines.push('Tarefas para fazer:',...tasks.map(x=>`${x.start} às ${x.end}: ${x.title}${x.priority==='Alta'?' — prioridade alta':''}.`));
  if(!events.length&&!tasks.length)lines.push('Você não tem compromissos ou tarefas por concluir marcados para hoje.');
  if(pending.length)lines.push('Também há tarefas de dias anteriores:',...pending.map(x=>`${x.title}, de ${parse(x.date).toLocaleDateString('pt-BR')}.`));
  const remaining=list.filter(x=>!x.done.includes(date)&&mins(x.end)>now.getHours()*60+now.getMinutes());
  if(remaining.length)lines.push(`O próximo item ainda em andamento ou por começar é ${remaining[0].title}, das ${remaining[0].start} às ${remaining[0].end}.`);
  if(overlaps(list))lines.push('Há horários sobrepostos na agenda. Vale revisar.');
  lines.push('Um passo de cada vez.');
  return lines.join('\n');
}
function showDailyBrief(){
  const box=$('#dailyReply');if(!box)return;box.hidden=false;box.className='daily-reply';box.replaceChildren();
  const text=document.createElement('p');text.className='daily-text';text.textContent=dailySummary();box.append(text);
  if('speechSynthesis' in window){const listen=document.createElement('button');listen.textContent='▷ Ouvir resumo';listen.onclick=()=>{window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(dailySummary());speech.lang='pt-BR';speech.rate=.95;speech.onend=speech.onerror=()=>{listen.textContent='▷ Ouvir resumo'};window.speechSynthesis.speak(speech);listen.textContent='Lendo…'};const stop=document.createElement('button');stop.textContent='Parar leitura';stop.onclick=()=>{window.speechSynthesis.cancel();listen.textContent='▷ Ouvir resumo'};box.append(listen,stop)}
}
const welcome=document.createElement('dialog');welcome.id='welcome';welcome.innerHTML=`<div class="welcome-top"><span class="welcome-mark">n<span>✳</span></span><button id="closeWelcome" aria-label="Fechar boas-vindas">✕</button></div><span class="tag">SEU ASSISTENTE PESSOAL</span><h1>Bem-vindo, chefe.</h1><p class="subtitle">Um cantinho para organizar o dia, encontrar seu ritmo e seguir com mais leveza.</p><div class="welcome-access"><strong>Um espaço só seu.</strong><p>Esta cópia guarda os dados no navegador deste aparelho. Não usa uma conta de IA e não faz chamadas a serviços pagos.</p></div><h2>Leve o Nilo para o iPhone</h2><ol><li>Abra este endereço no <strong>Safari</strong> do iPhone.</li><li>Toque em <strong>Compartilhar → Adicionar à Tela de Início</strong> e confirme o nome Nilo.</li><li>Abra o novo ícone e use <strong>Restaurar cópia</strong> para trazer sua agenda. Faça backups regularmente.</li></ol><div class="welcome-access"><strong>Já tem uma agenda cadastrada?</strong><p>Os dados ficam neste aparelho. Use <strong>Salvar cópia</strong> para guardar sua agenda e <strong>Restaurar cópia</strong> no outro aparelho para transferi-la.</p></div><p class="muted">O ícone abre o Nilo como aplicativo web em modo local. Sem IA externa, sincronização em nuvem ou notificações automáticas.</p><button id="enterNilo" class="primary welcome-enter">Vamos organizar meu dia →</button>`;
document.body.append(welcome);
function closeWelcome(){welcome.close();try{localStorage.setItem('nilo-welcome-seen','1')}catch{}}
$('#closeWelcome').onclick=closeWelcome;$('#enterNilo').onclick=()=>{closeWelcome();view='today';selected=today();render();showDailyBrief()};$('#iphoneHelp').onclick=()=>welcome.showModal();
try{if(!items.length&&!localStorage.getItem('nilo-welcome-seen'))welcome.showModal()}catch{}
window.addEventListener('pagehide',()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(view==='today'){selected=today();render()}else if(view==='week')render()}});
