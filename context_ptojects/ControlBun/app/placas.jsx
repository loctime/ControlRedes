// Placas (social posts) for ControlBun — 1080x1920 each.
// 3 variants: Light/problem, Dark/premium-CTA, Mixed/feature.

const PLACA_W = 1080;
const PLACA_H = 1920;

// ──────────── PLACA 1: Light, problem→solution split ────────────
function PlacaProblem() {
  return (
    <div style={{
      width:PLACA_W, height:PLACA_H, position:'relative',
      background:'#F5F7FA', overflow:'hidden',
      fontFamily:'Inter',
    }}>
      {/* top half — problem */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height: PLACA_H*0.46,
        background:'#143A6B',
        clipPath:'polygon(0 0, 100% 0, 100% 88%, 0 100%)',
        padding:'80px 80px 0',
      }}>
        <div style={{
          display:'inline-block',
          padding:'10px 22px', borderRadius:30,
          background:'rgba(212,162,76,0.18)', color:'#D4A24C',
          fontSize:22, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase',
        }}>El problema</div>

        <div style={{
          fontFamily:'Manrope', fontWeight:800, fontSize:118, lineHeight:0.96,
          color:'#F6F2E8', marginTop:36, letterSpacing:'-0.03em', textWrap:'pretty',
        }}>
          Subir<br/>documentos<br/>te toma<br/><span style={{color:'#D4A24C'}}>horas.</span>
        </div>
      </div>

      {/* solution badge */}
      <div style={{
        position:'absolute', top: PLACA_H*0.46 - 80, left:'50%',
        transform:'translateX(-50%)',
        background:'#22A745', color:'#fff',
        padding:'24px 44px', borderRadius:80,
        fontFamily:'Manrope', fontWeight:800, fontSize:42,
        boxShadow:'0 18px 50px rgba(34,167,69,0.4)',
        zIndex:5,
      }}>Con ControlBun: 30 segundos.</div>

      {/* bottom — phone */}
      <div style={{
        position:'absolute', top: PLACA_H*0.46 + 60, left:0, right:0, bottom:0,
        display:'flex', justifyContent:'center', paddingTop:40,
      }}>
        <TGScreen width={680} height={1050}>
          <TGBubble from="user" time="14:32">
            <TGFile name="documentos.pdf" size="2.4 MB" pages={8}/>
          </TGBubble>
          <div style={{
            alignSelf:'flex-start', maxWidth:'88%',
            background:'#fff', padding:'14px 16px', borderRadius:16, borderBottomLeftRadius:4,
            boxShadow:'0 1px 2px rgba(8,26,51,0.08)', fontSize:16,
          }}>
            <div style={{fontWeight:700, color:'#143A6B', marginBottom:10}}>🤖 IA clasificó:</div>
            {[
              ['Recibo de haberes','págs. 1–2'],
              ['Certificado F931','págs. 3–4'],
              ['Constancia ART','págs. 5–6'],
              ['Póliza seguro','págs. 7–8'],
            ].map(([n,p],i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'7px 0', borderTop: i ? '1px solid #EEF1F5' : 'none',
              }}>
                <span style={{width:20, height:20, borderRadius:10, background:'#22A745',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontSize:12, fontWeight:800}}>✓</span>
                <span style={{fontWeight:600, flex:1}}>{n}</span>
                <span style={{color:'#7A8896', fontFamily:'JetBrains Mono', fontSize:13}}>{p}</span>
              </div>
            ))}
          </div>
          <TGBubble from="bot" time="14:33">
            <span style={{color:'#22A745', fontWeight:700}}>✓ Subido a CD.</span>
          </TGBubble>
        </TGScreen>
      </div>

      {/* corner brand */}
      <div style={{position:'absolute', bottom:50, left:60}}>
        <CBLogo height={56} mode="light"/>
      </div>
      <div style={{position:'absolute', bottom:50, right:60,
        fontFamily:'JetBrains Mono', fontSize:22, color:'#6B7785', fontWeight:500}}>
        controldoc.app
      </div>
    </div>
  );
}

// ──────────── PLACA 2: Dark premium, big CTA ────────────
function PlacaCTA() {
  return (
    <div style={{
      width:PLACA_W, height:PLACA_H, position:'relative',
      background:'radial-gradient(ellipse at top, #143A6B 0%, #081A33 60%, #050E1E 100%)',
      overflow:'hidden', fontFamily:'Inter',
    }}>
      {/* gold radial accent */}
      <div style={{position:'absolute', top:-300, right:-300, width:900, height:900,
        background:'radial-gradient(circle, rgba(212,162,76,0.22), transparent 60%)'}}/>
      <div style={{position:'absolute', bottom:-200, left:-200, width:700, height:700,
        background:'radial-gradient(circle, rgba(34,167,69,0.12), transparent 60%)'}}/>

      {/* logo top */}
      <div style={{position:'absolute', top:80, left:'50%', transform:'translateX(-50%)'}}>
        <CBLogo height={64} mode="dark"/>
      </div>

      {/* eyebrow */}
      <div style={{position:'absolute', top:240, left:'50%', transform:'translateX(-50%)',
        padding:'12px 28px', border:'1px solid rgba(212,162,76,0.4)',
        borderRadius:40, color:'#D4A24C', fontSize:24, fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase',
      }}>Para empresas constructoras</div>

      {/* big number */}
      <div style={{
        position:'absolute', top:340, left:0, right:0, textAlign:'center',
        fontFamily:'Manrope', fontWeight:800,
        fontSize:540, lineHeight:0.85,
        background:'linear-gradient(180deg, #D4A24C 0%, #B98837 100%)',
        WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent',
        letterSpacing:'-0.06em',
      }}>30s</div>

      {/* headline */}
      <div style={{
        position:'absolute', top:920, left:60, right:60, textAlign:'center',
        fontFamily:'Manrope', fontWeight:800, fontSize:98, lineHeight:0.98,
        color:'#F6F2E8', letterSpacing:'-0.03em',
      }}>
        Tu documentación<br/>en CD,<br/><span style={{color:'#D4A24C'}}>resuelta.</span>
      </div>

      {/* features chip row */}
      <div style={{
        position:'absolute', top:1330, left:0, right:0,
        display:'flex', flexDirection:'column', gap:18, padding:'0 80px',
      }}>
        {[
          ['⚡','Subida automática con IA'],
          ['🔔','Alertas de vencimientos diarias'],
          ['📅','Parte mensual el día 1'],
        ].map(([ic,t],i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:24,
            padding:'24px 32px',
            background:'rgba(246,242,232,0.06)',
            border:'1px solid rgba(212,162,76,0.18)',
            borderRadius:24,
            color:'#F6F2E8', fontFamily:'Manrope', fontWeight:700, fontSize:38,
          }}>
            <span style={{fontSize:46}}>{ic}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>

      {/* contact */}
      <div style={{
        position:'absolute', bottom:80, left:0, right:0, textAlign:'center',
      }}>
        <div style={{
          display:'inline-block',
          padding:'24px 48px',
          background:'linear-gradient(135deg, #D4A24C 0%, #B98837 100%)',
          borderRadius:60,
          fontFamily:'Manrope', fontWeight:800, fontSize:38, color:'#081A33',
          boxShadow:'0 18px 50px rgba(212,162,76,0.3)',
        }}>contacto@controldoc.app</div>
        <div style={{marginTop:18, color:'rgba(246,242,232,0.7)',
          fontFamily:'JetBrains Mono', fontSize:22, letterSpacing:'0.05em'}}>
          336 4345088 · 336 4524758
        </div>
      </div>
    </div>
  );
}

// ──────────── PLACA 3: Mixed, feature focus (alertas) ────────────
function PlacaAlertas() {
  return (
    <div style={{
      width:PLACA_W, height:PLACA_H, position:'relative',
      background:'#F6F2E8', overflow:'hidden', fontFamily:'Inter',
    }}>
      {/* curved navy band */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height: PLACA_H,
        background:'#143A6B',
        clipPath:'ellipse(120% 55% at 50% 0%)',
      }}/>

      {/* eyebrow */}
      <div style={{position:'absolute', top:130, left:'50%', transform:'translateX(-50%)',
        color:'#22A745', fontFamily:'JetBrains Mono', fontWeight:600,
        fontSize:24, letterSpacing:'0.2em', textTransform:'uppercase',
      }}>/vencimientos</div>

      {/* headline */}
      <div style={{
        position:'absolute', top:200, left:60, right:60, textAlign:'center',
        fontFamily:'Manrope', fontWeight:800, fontSize:104, lineHeight:0.96,
        color:'#F6F2E8', letterSpacing:'-0.03em',
      }}>
        Nunca más<br/>te olvides<br/>de un <span style={{color:'#D4A24C'}}>vencimiento.</span>
      </div>

      {/* phone with alerts mock */}
      <div style={{
        position:'absolute', top:780, left:'50%', transform:'translateX(-50%)',
      }}>
        <TGScreen width={720} height={1000} time="13:00">
          <TGBubble from="bot" time="13:00">
            <div style={{fontWeight:700, marginBottom:8, color:'#E0463A', fontSize:16}}>⚠️ Alerta diaria</div>
            <div style={{fontSize:15, lineHeight:1.5}}>
              Tienes <b>3 documentos</b> próximos a vencer:
            </div>
            <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:8}}>
              {[
                ['🔴','Póliza ART','Vencido hace 2 días','#E0463A'],
                ['🟠','VTV — AB123CD','Vence mañana','#E89A2B'],
                ['🟡','Carnet — J. Pérez','Vence en 7 días','#D4A24C'],
              ].map(([dot,n,d,c],i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 12px', background:'#F5F7FA', borderRadius:10,
                  borderLeft:`4px solid ${c}`,
                }}>
                  <span style={{fontSize:18}}>{dot}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:14, color:'#0E1722'}}>{n}</div>
                    <div style={{fontSize:12, color:'#7A8896'}}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </TGBubble>
          <TGBubble from="user" time="13:01">
            Ya lo solucioné. ¡Gracias! 🙌
          </TGBubble>
        </TGScreen>
      </div>

      {/* footer */}
      <div style={{
        position:'absolute', bottom:60, left:60, right:60,
        display:'flex', justifyContent:'space-between', alignItems:'flex-end',
      }}>
        <CBLogo height={50} mode="light"/>
        <div style={{
          fontFamily:'JetBrains Mono', fontSize:22, color:'#6B7785',
          textAlign:'right', lineHeight:1.5,
        }}>
          contacto@controldoc.app<br/>
          <span style={{color:'#143A6B', fontWeight:600}}>controldoc.app</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PlacaProblem, PlacaCTA, PlacaAlertas, PLACA_W, PLACA_H });
