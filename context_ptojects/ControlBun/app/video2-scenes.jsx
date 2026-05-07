// video2-scenes.jsx — ControlBun Video 2 "Así funciona" — 9:16, 25s

const VIDEO_W = 1080;
const VIDEO_H = 1920;

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

function LocalSprite({ start = 0, end = Infinity, children }) {
  const parent = useSprite();
  const localTime = parent.localTime;
  const visible = localTime >= start && (end === Infinity ? true : localTime <= end);
  if (!visible) return null;
  const dur = isFinite(end) ? end - start : Infinity;
  const innerLocal = Math.max(0, localTime - start);
  const progress = dur > 0 && isFinite(dur) ? clamp(innerLocal / dur, 0, 1) : 0;
  return (
    <SpriteContext.Provider value={{ localTime: innerLocal, progress, duration: dur, visible: true }}>
      {typeof children === 'function'
        ? children({ localTime: innerLocal, progress, duration: dur, visible: true })
        : children}
    </SpriteContext.Provider>
  );
}

// ───────── Scene 1: Counter Hook (0–4s) ─────────
function SceneCounter() {
  const { localTime: t } = useSprite();

  // Glitch jitter: rapid positional noise in first 0.3s
  const gProg = clamp(t / 0.3, 0, 1);
  const glitchX = t < 0.3 ? Math.sin(t * 140) * 14 * (1 - gProg) : 0;
  const glitchY = t < 0.3 ? Math.cos(t * 100) * 6 * (1 - gProg) : 0;
  const glitchOp = t < 0.3 ? 0.4 + Math.abs(Math.sin(t * 80)) * 0.6 : 1;

  // Counter 0→40 from t=0.5 to t=3.4
  const cVal = Math.floor(Easing.easeOutQuad(clamp((t - 0.5) / 2.9, 0, 1)) * 40);

  // Rising particles — static seeds
  const SEEDS = [
    {x:90,sp:1.3,sz:5,d:0.0},{x:230,sp:0.9,sz:7,d:0.6},
    {x:380,sp:1.5,sz:4,d:1.1},{x:520,sp:0.8,sz:8,d:0.3},
    {x:650,sp:1.2,sz:5,d:1.7},{x:800,sp:1.0,sz:6,d:0.9},
    {x:940,sp:1.4,sz:4,d:0.4},{x:160,sp:0.7,sz:9,d:1.4},
    {x:440,sp:1.6,sz:5,d:0.8},{x:710,sp:0.9,sz:7,d:0.2},
    {x:860,sp:1.1,sz:4,d:1.6},{x:300,sp:1.3,sz:6,d:0.5},
    {x:60,sp:1.0,sz:7,d:1.2},{x:760,sp:1.4,sz:5,d:0.7},
    {x:1010,sp:0.8,sz:6,d:1.0},{x:490,sp:1.2,sz:4,d:1.8},
  ];

  return (
    <div style={{position:'absolute', inset:0, background:'#030712', overflow:'hidden'}}>
      {/* Scanlines */}
      <div style={{position:'absolute', inset:0, opacity:0.04, pointerEvents:'none',
        backgroundImage:'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 5px)'}}/>

      {/* Radial glow behind counter */}
      <div style={{
        position:'absolute', top:560, left:'50%', transform:'translateX(-50%)',
        width:940, height:940,
        background:'radial-gradient(circle,rgba(212,162,76,0.13) 0%,transparent 60%)',
        opacity: clamp((t - 0.3) * 4, 0, 1),
      }}/>

      {/* Rising gold particles */}
      {SEEDS.map((p, i) => {
        const cycle = 4.5;
        const pT = ((t - p.d) % cycle + cycle) % cycle;
        const pY = VIDEO_H + 20 - pT * p.sp * 500;
        if (pY < -20 || t < p.d) return null;
        const op = Math.min(clamp(pT * 0.8, 0, 1), clamp((cycle - pT) * 0.6, 0, 1)) * 0.55;
        return (
          <div key={i} style={{
            position:'absolute', left:p.x, top:pY,
            width:p.sz, height:p.sz,
            background:'#D4A24C', borderRadius:'50%',
            opacity: op, filter:'blur(1px)',
          }}/>
        );
      })}

      {/* Entry white flash */}
      {t < 0.15 && (
        <div style={{position:'absolute', inset:0, background:'#fff',
          opacity: Math.max(0, 0.9 - t * 7)}}/>
      )}

      {/* Horizontal glitch lines (entry) */}
      {t < 0.3 && [0.2, 0.45, 0.72].map((yFrac, i) => (
        <div key={i} style={{
          position:'absolute', left:0, right:0,
          top: VIDEO_H * yFrac,
          height: 2 + i * 3,
          background:'#D4A24C',
          opacity: Math.max(0, (0.3 - t) / 0.3) * 0.4,
          transform:`translateX(${Math.sin(t * 60 + i) * 30}px)`,
        }}/>
      ))}

      {/* Top question */}
      <LocalSprite start={0.2} end={4.0}>
        <TextSprite text="¿Cuánto tardás en subir" x={VIDEO_W/2} y={370}
          align="center" size={66} weight={700} color="rgba(246,242,232,0.6)" font="Manrope"/>
      </LocalSprite>
      <LocalSprite start={0.4} end={4.0}>
        <TextSprite text="tus legajos?" x={VIDEO_W/2} y={458}
          align="center" size={66} weight={700} color="rgba(246,242,232,0.6)" font="Manrope"/>
      </LocalSprite>

      {/* Giant counter */}
      <LocalSprite start={0.4} end={4.0}>
        {({ localTime: lt }) => (
          <div style={{
            position:'absolute', left:'50%', top:600,
            transform:`translateX(calc(-50% + ${glitchX}px)) translateY(${glitchY}px)`,
            fontFamily:'Manrope', fontWeight:900, fontSize:360, lineHeight:1,
            letterSpacing:'-0.06em',
            color:'#D4A24C',
            opacity: glitchOp * clamp(lt * 8, 0, 1),
            textShadow:'0 0 80px rgba(212,162,76,0.6),0 0 220px rgba(212,162,76,0.2)',
            willChange:'transform,opacity',
          }}>
            {cVal}
          </div>
        )}
      </LocalSprite>

      {/* Subtitle */}
      <LocalSprite start={0.7} end={4.0}>
        <TextSprite text="legajos cargados" x={VIDEO_W/2} y={1060}
          align="center" size={52} weight={500} color="rgba(246,242,232,0.45)" font="Manrope"/>
      </LocalSprite>

      {/* Gold badge */}
      <LocalSprite start={1.5} end={4.0}>
        {({ localTime: lt }) => {
          const e = Easing.easeOutBack(clamp(lt / 0.5, 0, 1));
          return (
            <div style={{
              position:'absolute', left:'50%', top:1180,
              transform:`translateX(-50%) scale(${0.5 + e * 0.5})`,
              opacity: clamp(lt * 4, 0, 1),
              background:'linear-gradient(135deg,#D4A24C 0%,#B98837 100%)',
              borderRadius:24, padding:'20px 52px',
              fontFamily:'Manrope', fontWeight:900, fontSize:58,
              color:'#081A33', letterSpacing:'-0.02em', whiteSpace:'nowrap',
              boxShadow:'0 20px 60px rgba(212,162,76,0.45)',
            }}>
              en 5 minutos.
            </div>
          );
        }}
      </LocalSprite>
    </div>
  );
}

// ───────── Scene 2: Workflow (4–13.5s, dur 9.5s) ─────────
function SceneWorkflow() {
  const { localTime: t } = useSprite();

  // Node positions (center X)
  const NODE_R = 90;
  const NODE_CY = 870;
  const NODE_TOP = NODE_CY - NODE_R; // 780
  const N_CX = [180, 540, 900];

  // Connection line geometry
  const L1_X1 = N_CX[0] + NODE_R;  // 270
  const L1_X2 = N_CX[1] - NODE_R;  // 450
  const L2_X1 = N_CX[1] + NODE_R;  // 630
  const L2_X2 = N_CX[2] - NODE_R;  // 810
  const LINE_W = L1_X2 - L1_X1;    // 180
  const LINE_Y = NODE_CY - 3;

  // Line grow progress
  const l1Prog = Easing.easeInOutCubic(clamp((t - 1.0) / 0.8, 0, 1));
  const l2Prog = Easing.easeInOutCubic(clamp((t - 2.2) / 0.8, 0, 1));

  // Particles along lines (3 per line, phase-offset)
  const PART_SPEED = 0.7;
  const PHASES = [0, 0.33, 0.67];

  const nodes = [
    {icon:'📱', label:'Mandás',      sub:'el PDF',       color:'#D4A24C', appear:0.8},
    {icon:'🤖', label:'La IA',       sub:'clasifica',    color:'#5B9BD5', appear:1.9},
    {icon:'✅', label:'ControlDoc',  sub:'actualizado',  color:'#22A745', appear:3.1},
  ];

  return (
    <div style={{position:'absolute', inset:0,
      background:'linear-gradient(160deg,#081A33 0%,#0D2545 100%)', overflow:'hidden'}}>

      {/* Top radial glow */}
      <div style={{position:'absolute', top:-280, left:'50%', transform:'translateX(-50%)',
        width:1200, height:900,
        background:'radial-gradient(circle,rgba(212,162,76,0.09) 0%,transparent 60%)'}}/>

      {/* Grid overlay */}
      <div style={{position:'absolute', inset:0, opacity:0.03,
        backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
        backgroundSize:'80px 80px'}}/>

      {/* Title */}
      <LocalSprite start={0} end={9.5}>
        <TextSprite text="Así funciona." x={VIDEO_W/2} y={160}
          align="center" size={106} weight={900} color="#F6F2E8" font="Manrope"/>
      </LocalSprite>
      <LocalSprite start={0.3} end={9.5}>
        <TextSprite text="De punta a punta." x={VIDEO_W/2} y={282}
          align="center" size={58} weight={600} color="#D4A24C" font="Manrope"/>
      </LocalSprite>

      {/* Step counter labels */}
      {nodes.map((_, i) => {
        if (t < nodes[i].appear) return null;
        const op = clamp((t - nodes[i].appear) * 4, 0, 1);
        return (
          <div key={i} style={{
            position:'absolute',
            left: N_CX[i] - 28,
            top: NODE_TOP - 60,
            width:56, height:40,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(255,255,255,0.07)',
            border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:20,
            fontFamily:'JetBrains Mono', fontWeight:700, fontSize:24,
            color:'rgba(246,242,232,0.5)',
            opacity: op,
          }}>
            0{i+1}
          </div>
        );
      })}

      {/* Connection line 1 */}
      {t >= 1.0 && (
        <div style={{
          position:'absolute', left:L1_X1, top:LINE_Y,
          width: LINE_W * l1Prog,
          height:6, borderRadius:3,
          background:'linear-gradient(90deg,#D4A24C,#5B9BD5)',
          boxShadow:'0 0 14px rgba(212,162,76,0.45)',
        }}/>
      )}

      {/* Particles on line 1 */}
      {l1Prog >= 1 && PHASES.map((ph, i) => {
        const p = ((t * PART_SPEED + ph) % 1 + 1) % 1;
        return (
          <div key={i} style={{
            position:'absolute',
            left: L1_X1 + p * LINE_W - 6,
            top: LINE_Y - 6,
            width:12, height:12, borderRadius:'50%',
            background:'#D4A24C',
            boxShadow:'0 0 12px rgba(212,162,76,1)',
          }}/>
        );
      })}

      {/* Connection line 2 */}
      {t >= 2.2 && (
        <div style={{
          position:'absolute', left:L2_X1, top:LINE_Y,
          width: LINE_W * l2Prog,
          height:6, borderRadius:3,
          background:'linear-gradient(90deg,#5B9BD5,#22A745)',
          boxShadow:'0 0 14px rgba(91,155,213,0.45)',
        }}/>
      )}

      {/* Particles on line 2 */}
      {l2Prog >= 1 && PHASES.map((ph, i) => {
        const p = ((t * PART_SPEED + ph + 0.5) % 1 + 1) % 1;
        return (
          <div key={i} style={{
            position:'absolute',
            left: L2_X1 + p * LINE_W - 6,
            top: LINE_Y - 6,
            width:12, height:12, borderRadius:'50%',
            background:'#5B9BD5',
            boxShadow:'0 0 12px rgba(91,155,213,1)',
          }}/>
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const e = Easing.easeOutBack(clamp((t - node.appear) / 0.5, 0, 1));
        if (t < node.appear) return null;
        return (
          <div key={i} style={{
            position:'absolute',
            left: N_CX[i] - NODE_R,
            top: NODE_TOP,
            width: NODE_R * 2,
            opacity: clamp((t - node.appear) * 3, 0, 1),
            transform:`scale(${0.3 + e * 0.7})`,
            transformOrigin:'center top',
          }}>
            <div style={{
              width:NODE_R*2, height:NODE_R*2, borderRadius:'50%',
              background:node.color,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:70, flexShrink:0,
              boxShadow:`0 0 50px ${node.color}55, 0 14px 36px rgba(0,0,0,0.35)`,
            }}>
              {node.icon}
            </div>
            <div style={{marginTop:16, textAlign:'center'}}>
              <div style={{fontFamily:'Manrope', fontWeight:800, fontSize:38,
                color:'#F6F2E8', lineHeight:1.1}}>{node.label}</div>
              <div style={{fontFamily:'Manrope', fontWeight:500, fontSize:30,
                color:'rgba(246,242,232,0.55)'}}>{node.sub}</div>
            </div>
          </div>
        );
      })}

      {/* Telegram screen */}
      <LocalSprite start={3.8} end={9.5}>
        {({ localTime: lt }) => {
          const e = Easing.easeOutCubic(clamp(lt / 0.6, 0, 1));
          return (
            <div style={{
              position:'absolute', left:'50%', top:1160,
              transform:`translateX(-50%) translateY(${(1 - e) * 120}px)`,
              opacity: clamp(lt * 2.5, 0, 1),
            }}>
              <TGScreen width={880} height={660}>
                <LocalSprite start={0.3}>
                  <TGBubble from="user" time="14:32">
                    <TGFile name="legajos-junio.pdf" size="3.1 MB" pages={12}/>
                  </TGBubble>
                </LocalSprite>
                <LocalSprite start={1.0} end={2.0}>
                  <TGTyping/>
                </LocalSprite>
                <LocalSprite start={2.0}>
                  {({ progress: p }) => (
                    <div style={{
                      alignSelf:'flex-start', maxWidth:'90%',
                      background:'#fff', padding:'12px 14px',
                      borderRadius:16, borderBottomLeftRadius:4,
                      boxShadow:'0 1px 2px rgba(8,26,51,0.08)', fontSize:14,
                    }}>
                      <div style={{fontWeight:700,color:'#143A6B',marginBottom:8,fontSize:15}}>
                        🤖 Analizando con IA…
                      </div>
                      {[
                        {n:'Recibo de haberes', d:0.0},
                        {n:'Certificado F931',  d:0.35},
                        {n:'Constancia ART',    d:0.70},
                        {n:'Póliza de seguro',  d:1.05},
                      ].map((row, j) => {
                        const rP = clamp((p * 3.5 - row.d) / 0.5, 0, 1);
                        return (
                          <div key={j} style={{
                            display:'flex', alignItems:'center', gap:8,
                            padding:'5px 0',
                            borderTop: j ? '1px solid #EEF1F5' : 'none',
                            opacity: rP, transform:`translateX(${(1-rP)*-10}px)`,
                          }}>
                            <span style={{
                              width:18,height:18,borderRadius:9,
                              background:rP>0.95?'#22A745':'#D8DDE3',
                              display:'flex',alignItems:'center',justifyContent:'center',
                              color:'#fff',fontSize:11,fontWeight:800,
                            }}>{rP>0.95?'✓':''}</span>
                            <span style={{fontWeight:600,color:'#0E1722',fontSize:14}}>{row.n}</span>
                          </div>
                        );
                      })}
                      <div style={{fontSize:11,color:'#7A8896',textAlign:'right',marginTop:6}}>14:32</div>
                    </div>
                  )}
                </LocalSprite>
                <LocalSprite start={4.5}>
                  <TGBubble from="bot" time="14:32">
                    <span style={{color:'#22A745',fontWeight:700}}>✓ 4 documentos</span> cargados en ControlDoc.
                  </TGBubble>
                </LocalSprite>
              </TGScreen>
            </div>
          );
        }}
      </LocalSprite>
    </div>
  );
}

// ───────── Scene 3: Alerta Nocturna (13.5–19.5s, dur 6s) ─────────
function SceneAlerta() {
  const { localTime: t } = useSprite();

  // Twinkling stars
  const STARS = [
    {x:80,y:200,sz:2},{x:250,y:140,sz:3},{x:440,y:80,sz:2},
    {x:600,y:310,sz:2},{x:750,y:170,sz:3},{x:900,y:100,sz:2},
    {x:150,y:410,sz:3},{x:360,y:510,sz:2},{x:680,y:460,sz:2},
    {x:980,y:340,sz:3},{x:50,y:600,sz:2},{x:1020,y:250,sz:2},
    {x:200,y:700,sz:2},{x:500,y:650,sz:3},{x:820,y:580,sz:2},
    {x:120,y:890,sz:2},{x:780,y:320,sz:2},{x:480,y:280,sz:3},
  ];

  // Notification slide in from right at t=2.5
  const notifE = Easing.easeOutBack(clamp((t - 2.5) / 0.65, 0, 1));
  const notifLeft = 1130 - notifE * 1050;

  return (
    <div style={{position:'absolute', inset:0,
      background:'linear-gradient(180deg,#010409 0%,#030A14 55%,#051022 100%)',
      overflow:'hidden'}}>

      {/* Stars */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position:'absolute', left:s.x, top:s.y,
          width:s.sz, height:s.sz, borderRadius:'50%',
          background:'#fff',
          opacity: (0.35 + Math.sin(t * 1.4 + i * 0.9) * 0.3) * 0.85,
        }}/>
      ))}

      {/* Moon glow */}
      <div style={{
        position:'absolute', top:-80, right:60,
        width:320, height:320, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(160,190,255,0.07) 0%,transparent 70%)',
      }}/>

      {/* Digital clock */}
      <LocalSprite start={0.2} end={6.0}>
        {({ localTime: lt }) => (
          <div style={{
            position:'absolute', left:'50%', top:350,
            transform:'translateX(-50%)',
            opacity: clamp(lt * 3, 0, 1),
          }}>
            <div style={{
              fontFamily:'JetBrains Mono,monospace',
              fontWeight:700, fontSize:210, lineHeight:1,
              letterSpacing:'0.02em', color:'#5B9BD5',
              textShadow:'0 0 50px rgba(91,155,213,0.75),0 0 120px rgba(91,155,213,0.3)',
            }}>01:00</div>
            <div style={{
              textAlign:'center', fontFamily:'Manrope',
              fontWeight:600, fontSize:42,
              color:'rgba(91,155,213,0.65)', letterSpacing:'0.18em', marginTop:6,
            }}>AM</div>
          </div>
        )}
      </LocalSprite>

      {/* Main copy */}
      <LocalSprite start={0.9} end={6.0}>
        <TextSprite text="Mientras dormías," x={VIDEO_W/2} y={870}
          align="center" size={80} weight={800} color="#F6F2E8" font="Manrope"/>
      </LocalSprite>
      <LocalSprite start={1.3} end={6.0}>
        <TextSprite text="ControlBun trabajó." x={VIDEO_W/2} y={970}
          align="center" size={80} weight={800} color="#D4A24C" font="Manrope"/>
      </LocalSprite>

      <LocalSprite start={1.9} end={6.0}>
        <TextSprite text="Parte mensual generado." x={VIDEO_W/2} y={1110}
          align="center" size={50} weight={600} color="rgba(246,242,232,0.55)" font="Manrope"/>
      </LocalSprite>
      <LocalSprite start={2.2} end={6.0}>
        <TextSprite text="Alertas enviadas. Cero intervención." x={VIDEO_W/2} y={1176}
          align="center" size={50} weight={600} color="rgba(246,242,232,0.55)" font="Manrope"/>
      </LocalSprite>

      {/* Telegram notification card */}
      {t >= 2.5 && (
        <div style={{
          position:'absolute', left:notifLeft, top:1410,
          width:920,
          background:'rgba(255,255,255,0.09)',
          backdropFilter:'blur(22px)',
          border:'1px solid rgba(255,255,255,0.14)',
          borderRadius:30,
          padding:'26px 32px',
          display:'flex', gap:22, alignItems:'center',
          boxShadow:'0 24px 70px rgba(0,0,0,0.55)',
        }}>
          <div style={{
            width:72, height:72, borderRadius:36,
            background:'#143A6B', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#22A745', fontWeight:800, fontSize:22, fontFamily:'Manrope',
            boxShadow:'0 0 20px rgba(20,58,107,0.5)',
          }}>CB</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Manrope', fontWeight:700, fontSize:32,
              color:'#F6F2E8', marginBottom:8}}>ControlBun</div>
            <div style={{fontFamily:'Inter', fontSize:26, color:'rgba(246,242,232,0.85)',
              lineHeight:1.35}}>
              ✅ Parte mensual generado — 47 empleados procesados.
            </div>
          </div>
        </div>
      )}

      {/* Tagline final */}
      <LocalSprite start={4.2} end={6.0}>
        {({ localTime: lt }) => {
          const e = Easing.easeOutBack(clamp(lt / 0.5, 0, 1));
          return (
            <div style={{
              position:'absolute', left:'50%', top:1710,
              transform:`translateX(-50%) scale(${0.7 + e * 0.3})`,
              opacity: clamp(lt * 4, 0, 1),
              fontFamily:'Manrope', fontWeight:800, fontSize:52,
              color:'rgba(246,242,232,0.45)',
              textAlign:'center', whiteSpace:'nowrap',
            }}>
              Sin que nadie lo pida.
            </div>
          );
        }}
      </LocalSprite>
    </div>
  );
}

// ───────── Scene 4: CTA (19.5–25s, dur 5.5s) ─────────
function SceneCTA2() {
  return (
    <div style={{position:'absolute', inset:0,
      background:'radial-gradient(circle at 50% 28%,#143A6B 0%,#081A33 55%,#051022 100%)',
      overflow:'hidden'}}>

      {/* Pulsing radial glow */}
      <LocalSprite start={0} end={5.5}>
        {({ localTime: lt }) => (
          <div style={{position:'absolute', inset:0,
            background:`radial-gradient(circle at ${50+Math.sin(lt)*7}% 32%,rgba(212,162,76,0.16),transparent 46%)`}}/>
        )}
      </LocalSprite>

      {/* Logo */}
      <LocalSprite start={0.1} end={5.5}>
        {({ localTime: lt }) => {
          const e = Easing.easeOutBack(clamp(lt / 0.7, 0, 1));
          return (
            <div style={{
              position:'absolute', left:'50%', top:400,
              transform:`translate(-50%,-50%) scale(${0.6 + e * 0.4})`,
              opacity: clamp(lt * 2.5, 0, 1),
            }}>
              <CBLogo height={190} mode="dark" stack/>
            </div>
          );
        }}
      </LocalSprite>

      {/* Stats comparison */}
      <LocalSprite start={0.8} end={5.5}>
        {({ localTime: lt }) => {
          const e = Easing.easeOutCubic(clamp(lt / 0.5, 0, 1));
          return (
            <div style={{
              position:'absolute', left:'50%', top:780,
              transform:`translateX(-50%) translateY(${(1-e)*40}px)`,
              opacity: clamp(lt * 3, 0, 1),
              display:'flex', gap:22, alignItems:'center',
            }}>
              {/* Before */}
              <div style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.09)',
                borderRadius:22, padding:'26px 34px', textAlign:'center',
              }}>
                <div style={{fontFamily:'JetBrains Mono', fontSize:22,
                  color:'rgba(246,242,232,0.35)', marginBottom:6,
                  textTransform:'uppercase', letterSpacing:'0.08em'}}>Antes</div>
                <div style={{fontFamily:'Manrope', fontWeight:900, fontSize:70,
                  color:'rgba(246,242,232,0.28)', lineHeight:1}}>3 hs</div>
                <div style={{fontFamily:'Manrope', fontSize:28,
                  color:'rgba(246,242,232,0.25)'}}>por semana</div>
              </div>

              {/* Arrow */}
              <div style={{color:'#D4A24C', fontSize:64, fontWeight:900, lineHeight:1}}>
                →
              </div>

              {/* After */}
              <div style={{
                background:'linear-gradient(135deg,rgba(212,162,76,0.14),rgba(212,162,76,0.04))',
                border:'1px solid rgba(212,162,76,0.4)',
                borderRadius:22, padding:'26px 34px', textAlign:'center',
                boxShadow:'0 0 50px rgba(212,162,76,0.12)',
              }}>
                <div style={{fontFamily:'JetBrains Mono', fontSize:22,
                  color:'#D4A24C', marginBottom:6,
                  textTransform:'uppercase', letterSpacing:'0.08em'}}>Hoy</div>
                <div style={{fontFamily:'Manrope', fontWeight:900, fontSize:70,
                  color:'#D4A24C', lineHeight:1}}>5 min</div>
                <div style={{fontFamily:'Manrope', fontSize:28,
                  color:'rgba(212,162,76,0.75)'}}>por día</div>
              </div>
            </div>
          );
        }}
      </LocalSprite>

      {/* Tagline */}
      <LocalSprite start={1.5} end={5.5}>
        <TextSprite text="Recuperaste tu tiempo." x={VIDEO_W/2} y={1120}
          align="center" size={72} weight={700} color="#F6F2E8" font="Manrope"/>
      </LocalSprite>

      {/* CTA button with shimmer */}
      <LocalSprite start={2.0} end={5.5}>
        {({ localTime: lt }) => {
          const e = Easing.easeOutBack(clamp(lt / 0.5, 0, 1));
          const shimX = ((lt * 0.7) % 1) * 220 - 60;
          return (
            <div style={{
              position:'absolute', left:'50%', top:1250,
              transform:`translateX(-50%) scale(${0.6 + e * 0.4})`,
              opacity: clamp(lt * 3, 0, 1),
            }}>
              <div style={{
                position:'relative', overflow:'hidden',
                padding:'32px 68px',
                background:'linear-gradient(135deg,#D4A24C 0%,#B98837 100%)',
                borderRadius:80,
                fontFamily:'Manrope', fontWeight:800, fontSize:52,
                color:'#081A33', letterSpacing:'-0.01em',
                boxShadow:'0 22px 65px rgba(212,162,76,0.42)',
                whiteSpace:'nowrap',
              }}>
                Probalo gratis →
                <div style={{
                  position:'absolute', top:0,
                  left:`${shimX}%`,
                  width:'55%', height:'100%',
                  background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)',
                  transform:'skewX(-18deg)',
                  pointerEvents:'none',
                }}/>
              </div>
            </div>
          );
        }}
      </LocalSprite>

      {/* Contact */}
      <LocalSprite start={2.7} end={5.5}>
        {({ localTime: lt }) => (
          <div style={{
            position:'absolute', left:0, right:0, bottom:130,
            display:'flex', flexDirection:'column', alignItems:'center', gap:14,
            opacity: clamp(lt * 3, 0, 1),
          }}>
            <div style={{fontSize:30, fontWeight:600, color:'#F6F2E8', fontFamily:'Inter'}}>
              contacto@controldoc.app
            </div>
            <div style={{fontSize:26, color:'rgba(246,242,232,0.55)',
              fontFamily:'JetBrains Mono', letterSpacing:'0.04em'}}>
              +54 336 4345088 · +54 336 4524758
            </div>
          </div>
        )}
      </LocalSprite>
    </div>
  );
}

Object.assign(window, {
  SceneCounter, SceneWorkflow, SceneAlerta, SceneCTA2,
  SceneFrame, LocalSprite, VIDEO_W, VIDEO_H,
});
