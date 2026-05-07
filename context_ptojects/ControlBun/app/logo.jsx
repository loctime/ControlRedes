// ControlBun logo — original mark, NOT recreating attached image.
// A monogram: rounded "C" + check inside, with B ligature.
// Two color modes: light (navy + green), dark (navy + gold).

function CBMark({ size = 96, mode = 'light' }) {
  const navy = mode === 'dark' ? '#0E2A4F' : '#143A6B';
  const accent = mode === 'dark' ? '#D4A24C' : '#22A745';
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* C shape */}
      <path
        d="M48 12 C28 12 12 28 12 48 C12 68 28 84 48 84"
        stroke={navy} strokeWidth="14" strokeLinecap="round" fill="none"
      />
      {/* check */}
      <path
        d="M30 49 L44 63 L70 32"
        stroke={accent} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  );
}

function CBLogo({ height = 48, mode = 'light', stack = false }) {
  const navy = mode === 'dark' ? '#F6F2E8' : '#143A6B';
  const accent = mode === 'dark' ? '#D4A24C' : '#22A745';
  const markSize = height * 1.05;
  if (stack) {
    return (
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap: height*0.18}}>
        <CBMark size={markSize} mode={mode}/>
        <div style={{
          fontFamily:'Manrope, system-ui, sans-serif',
          fontWeight:800,
          fontSize: height*0.78,
          letterSpacing:'-0.02em',
          lineHeight:1,
          color: navy,
        }}>
          Control<span style={{color:accent}}>Bun</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{display:'inline-flex', alignItems:'center', gap: height*0.28}}>
      <CBMark size={markSize} mode={mode}/>
      <div style={{
        fontFamily:'Manrope, system-ui, sans-serif',
        fontWeight:800,
        fontSize: height*0.82,
        letterSpacing:'-0.025em',
        lineHeight:1,
        color: navy,
      }}>
        Control<span style={{color:accent}}>Bun</span>
      </div>
    </div>
  );
}

Object.assign(window, { CBMark, CBLogo });
