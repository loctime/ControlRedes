// Video scenes for ControlBun ad — 9:16, ~25s
// Each scene gates itself on absolute timeline using a `start` prop.
// Inside scenes, we compute a local time relative to start.

const VIDEO_W = 1080;
const VIDEO_H = 1920;

// SceneFrame: renders children only while abs time ∈ [start, start+duration].
// Provides a local SpriteContext so children's useSprite() returns local time.
function SceneFrame({ start, duration, children }) {
  const { time } = useTimeline();
  const visible = time >= start && time <= start + duration;
  if (!visible) return null;
  const localTime = time - start;
  const progress = clamp(localTime / duration, 0, 1);
  return (
    <SpriteContext.Provider value={{ localTime, progress, duration, visible: true }}>
      {children}
    </SpriteContext.Provider>
  );
}

// LocalSprite: like Sprite, but its start/end are LOCAL to enclosing SceneFrame.
function LocalSprite({ start = 0, end = Infinity, children }) {
  const parent = useSprite();
  const localTime = parent.localTime;
  const visible = localTime >= start && localTime <= end;
  if (!visible) return null;
  const duration = end - start;
  const innerLocal = Math.max(0, localTime - start);
  const progress = duration > 0 && isFinite(duration) ? clamp(innerLocal / duration, 0, 1) : 0;
  return (
    <SpriteContext.Provider value={{ localTime: innerLocal, progress, duration, visible: true }}>
      {typeof children === 'function' ? children({ localTime: innerLocal, progress, duration, visible: true }) : children}
    </SpriteContext.Provider>
  );
}

// Local TextSprite — same as TextSprite but reads local sprite ctx (which we already provide).
// We can reuse TextSprite directly since it uses useSprite().

// ───────── Scene 1: Hook (0–4s) ─────────
function SceneHook() {
  const { localTime: t } = useSprite();
  const cursorX = 540 + Math.sin(t * 6) * 80;
  const cursorY = 1100 + Math.cos(t * 4) * 30;

  return (
    <div style={{position:'absolute', inset:0, background:'linear-gradient(180deg,#081A33 0%, #143A6B 100%)', overflow:'hidden'}}>
      <div style={{position:'absolute', inset:0, opacity:0.08,
        backgroundImage:'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize:'80px 80px'}}/>

      <LocalSprite start={0.2} end={4.0}>
        {({ localTime: lt }) => (
          <div style={{
            position:'absolute', top:280, left:'50%', transform:`translateX(-50%) rotate(${lt*180}deg)`,
            transformOrigin:'center',
            width:140, height:140, borderRadius:70,
            border:'8px solid #D4A24C', display:'flex', alignItems:'center', justifyContent:'center',
            opacity: clamp(lt*2, 0, 1),
          }}>
            <div style={{width:6, height:50, background:'#D4A24C',
              position:'absolute', top:18, left:'50%', transform:'translateX(-50%)', borderRadius:3}}/>
            <div style={{width:14, height:14, borderRadius:7, background:'#D4A24C'}}/>
          </div>
        )}
      </LocalSprite>

      <LocalSprite start={0.4} end={4.0}>
        <TextSprite text={"¿Horas perdidas"} x={VIDEO_W/2} y={520} align="center"
          size={104} weight={800} color="#F6F2E8" font="Manrope"/>
      </LocalSprite>
      <LocalSprite start={0.9} end={4.0}>
        <TextSprite text={"subiendo PDFs"} x={VIDEO_W/2} y={650} align="center"
          size={104} weight={800} color="#F6F2E8" font="Manrope"/>
      </LocalSprite>
      <LocalSprite start={1.4} end={4.0}>
        <TextSprite text={"uno por uno?"} x={VIDEO_W/2} y={780} align="center"
          size={104} weight={800} color="#D4A24C" font="Manrope"/>
      </LocalSprite>

      {[
        {x:120, y:1000, d:0, r:-15},
        {x:780, y:1050, d:0.2, r:12},
        {x:280, y:1280, d:0.4, r:8},
        {x:680, y:1380, d:0.6, r:-20},
        {x:160, y:1550, d:0.3, r:18},
        {x:760, y:1620, d:0.5, r:-8},
      ].map((p, i) => (
        <LocalSprite key={i} start={1.6 + p.d} end={4.0}>
          {({ localTime: lt }) => (
            <div style={{
              position:'absolute',
              left:p.x, top:p.y + Math.sin((lt + i)*2)*12,
              width:140, height:170, background:'#fff', borderRadius:12,
              transform:`rotate(${p.r + Math.sin(lt*1.5+i)*4}deg)`,
              boxShadow:'0 12px 30px rgba(0,0,0,0.4)',
              padding:14, opacity: clamp(lt*2, 0, 1),
            }}>
              <div style={{width:36, height:14, background:'#E0463A', borderRadius:3, marginBottom:10}}/>
              {[0.9, 0.7, 0.85, 0.5, 0.8].map((w, j) => (
                <div key={j} style={{height:6, background:'#D8DDE3', borderRadius:3, marginBottom:6, width:`${w*100}%`}}/>
              ))}
              <div style={{position:'absolute', bottom:10, right:12, fontSize:11, fontFamily:'JetBrains Mono', color:'#7A8896', fontWeight:600}}>PDF</div>
            </div>
          )}
        </LocalSprite>
      ))}

      <LocalSprite start={2.4} end={4.0}>
        <div style={{position:'absolute', left:cursorX, top:cursorY, width:36, height:36}}>
          <svg viewBox="0 0 24 24" width="36" height="36">
            <path d="M3 2 L3 18 L8 14 L11 22 L14 21 L11 13 L18 13 Z" fill="#fff" stroke="#0B1420" strokeWidth="1.5"/>
          </svg>
        </div>
      </LocalSprite>
    </div>
  );
}

// ───────── Scene 2: Solution (4–9.5s, dur 5.5) ─────────
function SceneSolution() {
  return (
    <div style={{position:'absolute', inset:0, background:'#F5F7FA', overflow:'hidden'}}>
      <LocalSprite start={0} end={5.5}>
        <TextSprite text={"Existe otra forma."} x={VIDEO_W/2} y={240} align="center"
          size={84} weight={800} color="#143A6B" font="Manrope"/>
      </LocalSprite>

      <LocalSprite start={0.4} end={5.5}>
        {({ localTime: lt }) => (
          <div style={{
            position:'absolute', left:'50%', top:380,
            transform:`translateX(-50%) scale(${0.92 + Easing.easeOutBack(clamp(lt/0.5,0,1))*0.08})`,
            opacity: clamp(lt*3, 0, 1),
          }}>
            <TGScreen width={780} height={1380}>
              <LocalSprite start={0.6} end={5.5}>
                <TGBubble from="user" time="14:32">
                  <TGFile name="documentos-mayo.pdf" size="2.4 MB" pages={8}/>
                </TGBubble>
              </LocalSprite>
              <LocalSprite start={1.4} end={5.5}>
                <TGTyping/>
              </LocalSprite>
              <LocalSprite start={2.0} end={5.5}>
                {({ progress }) => (
                  <div style={{
                    alignSelf:'flex-start', maxWidth:'88%',
                    background:'#fff', padding:'12px 14px', borderRadius:16, borderBottomLeftRadius:4,
                    boxShadow:'0 1px 2px rgba(8,26,51,0.08)', fontSize:14,
                  }}>
                    <div style={{fontWeight:700, color:'#143A6B', marginBottom:8, fontSize:15}}>
                      🤖 Analizando con IA…
                    </div>
                    {[
                      {n:'Recibo de haberes', p:'págs. 1–2', d:0},
                      {n:'Certificado F931',  p:'págs. 3–4', d:0.4},
                      {n:'Constancia ART',    p:'págs. 5–6', d:0.8},
                      {n:'Póliza seguro',     p:'págs. 7–8', d:1.2},
                    ].map((row, i) => {
                      const rowProgress = clamp((progress*3.5 - row.d)/0.5, 0, 1);
                      return (
                        <div key={i} style={{
                          display:'flex', alignItems:'center', gap:8,
                          padding:'6px 0', borderTop: i ? '1px solid #EEF1F5' : 'none',
                          opacity: rowProgress, transform:`translateX(${(1-rowProgress)*-12}px)`,
                        }}>
                          <span style={{
                            width:18, height:18, borderRadius:9,
                            background: rowProgress > 0.95 ? '#22A745' : '#D8DDE3',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:'#fff', fontSize:11, fontWeight:800,
                          }}>{rowProgress > 0.95 ? '✓' : ''}</span>
                          <div style={{flex:1, display:'flex', justifyContent:'space-between', gap:8}}>
                            <span style={{fontWeight:600, color:'#0E1722'}}>{row.n}</span>
                            <span style={{color:'#7A8896', fontFamily:'JetBrains Mono', fontSize:12}}>{row.p}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{fontSize:11, color:'#7A8896', textAlign:'right', marginTop:6}}>14:32</div>
                  </div>
                )}
              </LocalSprite>
              <LocalSprite start={4.4} end={5.5}>
                <TGBubble from="bot" time="14:33">
                  <span style={{color:'#22A745', fontWeight:700}}>✓ 4 documentos</span> subidos a CD.
                </TGBubble>
              </LocalSprite>
            </TGScreen>
          </div>
        )}
      </LocalSprite>
    </div>
  );
}

// ───────── Scene 3: Features (9.5–14s, dur 4.5) ─────────
function SceneFeatures() {
  const features = [
    { icon:'⏰', title:'Alertas de vencimientos', sub:'todos los días, automáticas', color:'#E89A2B' },
    { icon:'📅', title:'Parte mensual', sub:'se graba solo el día 1', color:'#22A745' },
    { icon:'⚡', title:'Subida con IA',  sub:'PDFs clasificados en segundos', color:'#143A6B' },
  ];
  return (
    <div style={{position:'absolute', inset:0, background:'#143A6B', overflow:'hidden'}}>
      <div style={{position:'absolute', top:-200, right:-200, width:800, height:800,
        background:'radial-gradient(circle, rgba(212,162,76,0.25) 0%, transparent 70%)'}}/>

      <LocalSprite start={0} end={4.5}>
        <TextSprite text={"Todo desde Telegram."} x={VIDEO_W/2} y={200} align="center"
          size={78} weight={800} color="#F6F2E8" font="Manrope"/>
      </LocalSprite>
      <LocalSprite start={0.3} end={4.5}>
        <TextSprite text={"Sin entrar a la web."} x={VIDEO_W/2} y={300} align="center"
          size={78} weight={800} color="#D4A24C" font="Manrope"/>
      </LocalSprite>

      {features.map((f, i) => (
        <LocalSprite key={i} start={0.7 + i*0.35} end={4.5}>
          {({ localTime: lt }) => {
            const e = Easing.easeOutBack(clamp(lt/0.5, 0, 1));
            return (
              <div style={{
                position:'absolute', left:80, top:520 + i*340,
                width: VIDEO_W - 160, height: 280,
                background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(212,162,76,0.25)',
                borderRadius:32, padding:'40px 44px',
                display:'flex', alignItems:'center', gap:36,
                opacity: clamp(lt*3, 0, 1),
                transform: `translateX(${(1-e)*60}px)`,
                backdropFilter:'blur(8px)',
              }}>
                <div style={{
                  width:160, height:160, borderRadius:32, background:f.color,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:80, flexShrink:0,
                  boxShadow:'0 12px 30px rgba(0,0,0,0.3)',
                }}>{f.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:'Manrope', fontWeight:800, fontSize:54,
                    color:'#F6F2E8', letterSpacing:'-0.02em', lineHeight:1.05}}>{f.title}</div>
                  <div style={{fontSize:30, color:'rgba(246,242,232,0.7)', marginTop:8}}>{f.sub}</div>
                </div>
              </div>
            );
          }}
        </LocalSprite>
      ))}
    </div>
  );
}

// ───────── Scene 4: CTA (14–25s, dur 11) ─────────
function SceneCTA() {
  return (
    <div style={{position:'absolute', inset:0,
      background:'radial-gradient(circle at 50% 30%, #143A6B 0%, #081A33 60%, #051022 100%)',
      overflow:'hidden'}}>
      <LocalSprite start={0} end={11}>
        {({ localTime: lt }) => (
          <div style={{position:'absolute', inset:0,
            background:`radial-gradient(circle at ${50 + Math.sin(lt)*8}% 35%, rgba(212,162,76,0.18), transparent 50%)`}}/>
        )}
      </LocalSprite>

      <LocalSprite start={0.1} end={11}>
        {({ localTime: lt }) => {
          const e = Easing.easeOutBack(clamp(lt/0.6, 0, 1));
          return (
            <div style={{
              position:'absolute', left:'50%', top:480,
              transform:`translate(-50%, -50%) scale(${0.7 + e*0.3})`,
              opacity: clamp(lt*2, 0, 1),
            }}>
              <CBLogo height={180} mode="dark" stack/>
            </div>
          );
        }}
      </LocalSprite>

      <LocalSprite start={0.8} end={11}>
        <TextSprite text={"Recuperá tu tiempo."} x={VIDEO_W/2} y={930} align="center"
          size={72} weight={700} color="#F6F2E8" font="Manrope"/>
      </LocalSprite>

      <LocalSprite start={1.3} end={11}>
        {({ localTime: lt }) => (
          <div style={{
            position:'absolute', left:'50%', top:1080,
            transform:`translateX(-50%)`,
            opacity: clamp(lt*3, 0, 1),
            display:'flex', flexDirection:'column', alignItems:'center', gap:28,
          }}>
            <div style={{
              padding:'28px 56px',
              background:'linear-gradient(135deg, #D4A24C 0%, #B98837 100%)',
              borderRadius:80,
              fontFamily:'Manrope', fontWeight:800, fontSize:46,
              color:'#081A33', letterSpacing:'-0.01em',
              boxShadow:'0 20px 60px rgba(212,162,76,0.35)',
            }}>Probalo gratis →</div>
          </div>
        )}
      </LocalSprite>

      <LocalSprite start={1.8} end={11}>
        {({ localTime: lt }) => (
          <div style={{
            position:'absolute', left:0, right:0, bottom:120,
            display:'flex', flexDirection:'column', alignItems:'center', gap:14,
            opacity: clamp(lt*3, 0, 1),
            color:'#F6F2E8', fontFamily:'Inter',
          }}>
            <div style={{fontSize:30, fontWeight:600, letterSpacing:'0.01em'}}>contacto@controldoc.app</div>
            <div style={{fontSize:26, color:'rgba(246,242,232,0.65)', fontFamily:'JetBrains Mono', letterSpacing:'0.04em'}}>
              +54 336 4345088 &nbsp;·&nbsp; +54 336 4524758
            </div>
          </div>
        )}
      </LocalSprite>
    </div>
  );
}

Object.assign(window, { SceneHook, SceneSolution, SceneFeatures, SceneCTA, SceneFrame, LocalSprite, VIDEO_W, VIDEO_H });
