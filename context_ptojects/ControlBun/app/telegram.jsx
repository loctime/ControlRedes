// Telegram-style chat mockup component (original styling, not recreating Telegram UI)
// Used inside the video and placas to show ControlBun in action.

function TGScreen({ width = 540, height = 980, children, header = true, time = '14:32' }) {
  return (
    <div style={{
      width, height,
      background: '#E7EBEF',
      borderRadius: 44,
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 30px 80px rgba(8,26,51,0.35)',
      border: '8px solid #0E1722',
    }}>
      {/* status bar */}
      <div style={{
        height: 44, display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 28px', fontSize:15, fontWeight:600, color:'#0E1722',
        background:'#E7EBEF',
      }}>
        <span>{time}</span>
        <span style={{display:'flex', gap:6, alignItems:'center'}}>
          <span style={{width:18, height:10, border:'1.5px solid #0E1722', borderRadius:2, position:'relative'}}>
            <span style={{position:'absolute', inset:1, background:'#0E1722', borderRadius:1, width:'80%'}}/>
          </span>
        </span>
      </div>
      {/* chat header */}
      {header && (
        <div style={{
          height: 64, display:'flex', alignItems:'center', gap:12,
          padding:'0 18px',
          background:'#FFFFFF',
          borderBottom:'1px solid #D8DDE3',
        }}>
          <div style={{
            width:40, height:40, borderRadius:20,
            background:'#143A6B',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#22A745', fontWeight:800, fontSize:16, fontFamily:'Manrope',
          }}>CB</div>
          <div style={{display:'flex', flexDirection:'column'}}>
            <div style={{fontWeight:700, fontSize:16, color:'#0E1722'}}>ControlBun</div>
            <div style={{fontSize:12, color:'#22A745', fontWeight:500}}>en línea</div>
          </div>
        </div>
      )}
      {/* messages area */}
      <div style={{
        position:'absolute',
        top: header ? 108 : 44,
        left:0, right:0, bottom:0,
        padding:'16px 14px',
        display:'flex', flexDirection:'column', gap:10,
        background:`#E7EBEF`,
        overflow:'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function TGBubble({ from = 'user', children, time = '14:32', tail = true }) {
  const isBot = from === 'bot';
  return (
    <div style={{
      alignSelf: isBot ? 'flex-start' : 'flex-end',
      maxWidth: '82%',
      background: isBot ? '#FFFFFF' : '#E1FFC7',
      color: '#0E1722',
      padding: '10px 14px 8px',
      borderRadius: 16,
      borderBottomRightRadius: !isBot && tail ? 4 : 16,
      borderBottomLeftRadius:  isBot && tail ? 4 : 16,
      fontSize: 15,
      lineHeight: 1.35,
      boxShadow: '0 1px 2px rgba(8,26,51,0.08)',
      position:'relative',
    }}>
      <div>{children}</div>
      <div style={{
        fontSize: 11, color:'#7A8896', textAlign:'right', marginTop:4,
        fontVariantNumeric:'tabular-nums',
      }}>
        {time}{!isBot && <span style={{color:'#229ED9', marginLeft:4}}>✓✓</span>}
      </div>
    </div>
  );
}

function TGFile({ name, size, pages }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'8px 4px',
    }}>
      <div style={{
        width:46, height:46, borderRadius:23,
        background:'#E0463A',
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'#fff', fontWeight:700, fontSize:11, fontFamily:'Manrope',
      }}>PDF</div>
      <div>
        <div style={{fontWeight:600, fontSize:14, color:'#0E1722'}}>{name}</div>
        <div style={{fontSize:12, color:'#7A8896'}}>{size} · {pages} páginas</div>
      </div>
    </div>
  );
}

function TGTyping() {
  return (
    <div style={{
      alignSelf:'flex-start',
      background:'#FFFFFF',
      padding:'10px 14px',
      borderRadius:16, borderBottomLeftRadius:4,
      display:'flex', gap:4, alignItems:'center',
      boxShadow:'0 1px 2px rgba(8,26,51,0.08)',
    }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width:6, height:6, borderRadius:3, background:'#7A8896',
          animation:`tgblink 1.2s ${i*0.2}s infinite ease-in-out`,
          opacity:0.5,
        }}/>
      ))}
      <style>{`@keyframes tgblink { 0%,80%,100% {opacity:0.3; transform:translateY(0)} 40% {opacity:1; transform:translateY(-2px)} }`}</style>
    </div>
  );
}

Object.assign(window, { TGScreen, TGBubble, TGFile, TGTyping });
