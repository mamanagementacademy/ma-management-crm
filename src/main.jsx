import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Search, Plus, Users, Handshake, Building2, FileText, CalendarDays, FolderOpen, Euro, Trash2, Pencil } from 'lucide-react'
import { supabase } from './lib/supabase'
import './styles.css'

const tables = ['players','deals','clubs','contracts','deadlines','documents']

function euro(value){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value||0))}
function initials(name){return String(name||'?').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}

function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [msg,setMsg]=useState('')
  async function signIn(){
    setMsg('')
    const { error } = await supabase.auth.signInWithPassword({email,password})
    if(error) setMsg(error.message)
  }
  async function signUp(){
    setMsg('')
    const { error } = await supabase.auth.signUp({email,password})
    if(error) setMsg(error.message)
    else setMsg('Account creato. Controlla la mail se Supabase richiede conferma.')
  }
  return <div className="login"><div className="loginCard">
    <img src="/ma-logo.jpg"/>
    <h1>MA Management CRM</h1>
    <p>Accesso cloud sincronizzato</p>
    <div className="field"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email"/></div>
    <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password"/></div>
    <button className="primary wide" onClick={signIn}>Accedi</button>
    <button className="secondary wide" onClick={signUp}>Crea account</button>
    {msg && <p className="msg">{msg}</p>}
  </div></div>
}

function App(){
  const [session,setSession]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)})
    const { data:{subscription} } = supabase.auth.onAuthStateChange((_event,session)=>setSession(session))
    return ()=>subscription.unsubscribe()
  },[])

  if(loading) return <div className="login">Caricamento...</div>
  if(!session) return <Login/>
  return <CRM user={session.user}/>
}

function CRM({user}){
  const [data,setData]=useState({players:[],deals:[],clubs:[],contracts:[],deadlines:[],documents:[]})
  const [page,setPage]=useState('dashboard')
  const [search,setSearch]=useState('')
  const [modal,setModal]=useState(null)
  const [loading,setLoading]=useState(true)

  async function loadAll(){
    setLoading(true)
    const next={}
    for(const table of tables){
      const {data:rows,error}=await supabase.from(table).select('*').order('created_at',{ascending:false})
      next[table]=rows||[]
    }
    setData(next)
    setLoading(false)
  }

  useEffect(()=>{loadAll()},[])

  async function saveItem(type,item){
    const payload = normalizeForDb(type,item,user.id)
    if(item.id){
      await supabase.from(type).update(payload).eq('id',item.id)
    }else{
      await supabase.from(type).insert(payload)
    }
    setModal(null)
    loadAll()
  }

  async function deleteItem(type,id){
    if(!confirm('Eliminare questo elemento?')) return
    await supabase.from(type).delete().eq('id',id)
    loadAll()
  }

  const totalCommissions=data.deals.reduce((s,x)=>s+Number(x.commission||0),0)
  const totalDealsValue=data.deals.reduce((s,x)=>s+Number(x.value||0),0)

  const pages=[
    ['dashboard','Dashboard',Users],['players','Calciatori',Users],['deals','Trattative',Handshake],['clubs','Club & Contatti',Building2],
    ['contracts','Contratti',FileText],['deadlines','Scadenze',CalendarDays],['documents','Documenti',FolderOpen],['finance','Finanze',Euro]
  ]

  function filter(items,fields){
    if(!search)return items
    const q=search.toLowerCase()
    return items.filter(item=>fields.some(f=>String(item[f]||'').toLowerCase().includes(q)))
  }

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><img src="/ma-logo.jpg"/><div><h1>MA Management</h1><p>Cloud CRM</p></div></div>
      <nav>{pages.map(([key,label,Icon])=><button key={key} onClick={()=>setPage(key)} className={page===key?'active':''}><Icon size={18}/>{label}</button>)}</nav>
      <button className="secondary logout" onClick={()=>supabase.auth.signOut()}>Esci</button>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca calciatori, club, trattative..."/></div>
        <button className="primary" onClick={()=>setModal({type:page==='dashboard'?'players':page})}><Plus size={18}/>Nuovo</button>
      </header>

      {loading && <Panel title="Caricamento dati">Attendi...</Panel>}

      {!loading && page==='dashboard' && <>
        <Hero title="Dashboard MA Management" subtitle="Dati sincronizzati in cloud tra PC e iPhone"/>
        <div className="stats">
          <Stat label="Calciatori" value={data.players.length} icon="👥"/>
          <Stat label="Trattative" value={data.deals.length} icon="🤝"/>
          <Stat label="Commissioni" value={euro(totalCommissions)} icon="💶"/>
          <Stat label="Valore trattative" value={euro(totalDealsValue)} icon="📈"/>
        </div>
        <div className="grid two">
          <Panel title="Trattative in evidenza"><Table type="deals" rows={data.deals} columns={[
            ['player','Giocatore'],['club','Club'],['stage','Fase',x=><span className="pill">{x.stage}</span>],['value','Valore',x=>euro(x.value)]
          ]} onEdit={x=>setModal({type:'deals',item:x})} onDelete={deleteItem}/></Panel>
          <Panel title="Scadenze urgenti">{data.deadlines.map(d=><div className="notice" key={d.id}><b>{d.title}</b><span>{d.due_date} · {d.priority}</span></div>)}</Panel>
        </div>
      </>}

      {!loading && page==='players' && <ListPage title="Calciatori" subtitle="Anagrafica completa assistiti" type="players" rows={filter(data.players,['name','role','club','status'])} columns={[
        ['name','Nome',x=><><Avatar name={x.name}/>{x.name}</>],['role','Ruolo'],['club','Club'],['value','Valore',x=>euro(x.value)],['contract_end','Contratto'],['status','Stato',x=><span className="pill">{x.status}</span>]
      ]} setModal={setModal} deleteItem={deleteItem}/>}

      {!loading && page==='deals' && <ListPage title="Trattative" subtitle="Trasferimenti, rinnovi e offerte" type="deals" rows={filter(data.deals,['player','club','stage'])} columns={[
        ['player','Giocatore'],['club','Club'],['stage','Fase'],['value','Valore',x=>euro(x.value)],['commission','Commissione',x=>euro(x.commission)],['probability','Probabilità']
      ]} setModal={setModal} deleteItem={deleteItem}/>}

      {!loading && page==='clubs' && <ListPage title="Club & Contatti" subtitle="Direttori sportivi, scout e intermediari" type="clubs" rows={filter(data.clubs,['club','contact','email'])} columns={[
        ['club','Club'],['contact','Contatto'],['role','Ruolo'],['phone','Telefono'],['email','Email']
      ]} setModal={setModal} deleteItem={deleteItem}/>}

      {!loading && page==='contracts' && <ListPage title="Contratti" subtitle="Procure, mandati e accordi" type="contracts" rows={filter(data.contracts,['player','type','status'])} columns={[
        ['player','Giocatore'],['type','Tipo'],['start_date','Inizio'],['end_date','Fine'],['commission','Commissione'],['status','Stato']
      ]} setModal={setModal} deleteItem={deleteItem}/>}

      {!loading && page==='deadlines' && <ListPage title="Scadenze" subtitle="Promemoria operativi" type="deadlines" rows={filter(data.deadlines,['title','type','priority'])} columns={[
        ['title','Titolo'],['due_date','Data'],['type','Tipo'],['priority','Priorità'],['status','Stato']
      ]} setModal={setModal} deleteItem={deleteItem}/>}

      {!loading && page==='documents' && <ListPage title="Documenti" subtitle="Link, video e PDF" type="documents" rows={filter(data.documents,['title','related','type'])} columns={[
        ['title','Titolo'],['related','Associato'],['type','Tipo'],['link','Link',x=>x.link?<a href={x.link} target="_blank">Apri</a>:''],['notes','Note']
      ]} setModal={setModal} deleteItem={deleteItem}/>}

      {!loading && page==='finance' && <>
        <Hero title="Finanze" subtitle="Valori e commissioni sincronizzati"/>
        <div className="stats"><Stat label="Commissioni" value={euro(totalCommissions)} icon="💶"/><Stat label="Valore trattative" value={euro(totalDealsValue)} icon="📈"/><Stat label="Deal" value={data.deals.length} icon="🤝"/><Stat label="Contratti" value={data.contracts.length} icon="📄"/></div>
      </>}
    </main>
    {modal && <Editor modal={modal} onClose={()=>setModal(null)} onSave={saveItem}/>}
  </div>
}

function normalizeForDb(type,item,owner_id){
  const x={...item,owner_id:user.id}
  delete x.created_at
  if(type==='players') return {owner_id,name:x.name,role:x.role,club:x.club,value:Number(x.value||0),contract_end:x.contract_end||x.contractEnd||null,status:x.status,notes:x.notes}
  if(type==='deals') return {owner_id,player:x.player,club:x.club,stage:x.stage,value:Number(x.value||0),commission:Number(x.commission||0),probability:Number(x.probability||0),notes:x.notes}
  if(type==='clubs') return {owner_id,club:x.club,contact:x.contact,role:x.role,phone:x.phone,email:x.email,notes:x.notes}
  if(type==='contracts') return {owner_id,player:x.player,type:x.type,start_date:x.start_date||x.start||null,end_date:x.end_date||x.end||null,commission:x.commission,status:x.status,notes:x.notes}
  if(type==='deadlines') return {owner_id,title:x.title,due_date:x.due_date||x.date||null,type:x.type,priority:x.priority,status:x.status}
  if(type==='documents') return {owner_id,title:x.title,related:x.related,type:x.type,link:x.link,notes:x.notes}
  return x
}

function Hero({title,subtitle}){return <div className="hero"><div><h2>{title}</h2><p>{subtitle}</p></div><span>{new Date().toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'})}</span></div>}
function Stat({icon,label,value}){return <div className="stat"><div className="statIcon">{icon}</div><div><small>{label}</small><b>{value}</b></div></div>}
function Panel({title,children}){return <section className="panel"><div className="panelHead"><h3>{title}</h3></div>{children}</section>}
function Avatar({name}){return <span className="avatar">{initials(name)}</span>}
function ListPage({title,subtitle,type,rows,columns,setModal,deleteItem}){return <><Hero title={title} subtitle={subtitle}/><Panel title={title}><button className="primary inline" onClick={()=>setModal({type})}>+ Nuovo</button><Table type={type} rows={rows} columns={columns} onEdit={x=>setModal({type,item:x})} onDelete={deleteItem}/></Panel></>}
function Table({type,rows,columns,onEdit,onDelete}){return <div className="tableWrap"><table><thead><tr>{columns.map(c=><th key={c[1]}>{c[1]}</th>)}<th>Azioni</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}>{columns.map(c=><td key={c[1]}>{c[2]?c[2](row):row[c[0]]}</td>)}<td className="actions"><button onClick={()=>onEdit(row)}><Pencil size={15}/></button><button onClick={()=>onDelete(type,row.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div>}

function Editor({modal,onClose,onSave}){
  const [item,setItem]=useState(modal.item||{})
  const fields=getFields(modal.type)
  function update(key,value){setItem({...item,[key]:value})}
  return <div className="modal"><div className="modalBox">
    <div className="modalHead"><h3>{modal.item?'Modifica':'Nuovo'} {modal.type}</h3><button onClick={onClose}>×</button></div>
    <div className="formGrid">{fields.map(f=><div className={f.type==='textarea'?'field full':'field'} key={f.key}><label>{f.label}</label>{f.type==='select'?<select value={item[f.key]||''} onChange={e=>update(f.key,e.target.value)}>{f.options.map(o=><option key={o}>{o}</option>)}</select>:f.type==='textarea'?<textarea value={item[f.key]||''} onChange={e=>update(f.key,e.target.value)}/>:<input type={f.type||'text'} value={item[f.key]||''} onChange={e=>update(f.key,e.target.value)}/>}</div>)}</div>
    <div className="modalActions"><button className="secondary" onClick={onClose}>Annulla</button><button className="primary" onClick={()=>onSave(modal.type,item)}>Salva</button></div>
  </div></div>
}

function getFields(type){
  return {
    players:[{key:'name',label:'Nome'},{key:'role',label:'Ruolo',type:'select',options:['Portiere','Difensore','Centrocampista','Esterno','Trequartista','Attaccante']},{key:'club',label:'Club'},{key:'value',label:'Valore €',type:'number'},{key:'contract_end',label:'Scadenza contratto',type:'date'},{key:'status',label:'Stato',type:'select',options:['Attivo','Da rinnovare','In scadenza','Archiviato']},{key:'notes',label:'Note',type:'textarea'}],
    deals:[{key:'player',label:'Giocatore'},{key:'club',label:'Club'},{key:'stage',label:'Fase',type:'select',options:['Interesse','In trattativa','Offerta ricevuta','Chiusura','Saltata']},{key:'value',label:'Valore €',type:'number'},{key:'commission',label:'Commissione €',type:'number'},{key:'probability',label:'Probabilità %',type:'number'},{key:'notes',label:'Note',type:'textarea'}],
    clubs:[{key:'club',label:'Club'},{key:'contact',label:'Contatto'},{key:'role',label:'Ruolo'},{key:'phone',label:'Telefono'},{key:'email',label:'Email'},{key:'notes',label:'Note',type:'textarea'}],
    contracts:[{key:'player',label:'Giocatore'},{key:'type',label:'Tipo'},{key:'start_date',label:'Inizio',type:'date'},{key:'end_date',label:'Fine',type:'date'},{key:'commission',label:'Commissione'},{key:'status',label:'Stato'},{key:'notes',label:'Note',type:'textarea'}],
    deadlines:[{key:'title',label:'Titolo'},{key:'due_date',label:'Data',type:'date'},{key:'type',label:'Tipo'},{key:'priority',label:'Priorità',type:'select',options:['Bassa','Media','Alta']},{key:'status',label:'Stato',type:'select',options:['Aperta','Completata']}],
    documents:[{key:'title',label:'Titolo'},{key:'related',label:'Associato a'},{key:'type',label:'Tipo'},{key:'link',label:'Link'},{key:'notes',label:'Note',type:'textarea'}]
  }[type]||[]
}

createRoot(document.getElementById('root')).render(<App/>)
