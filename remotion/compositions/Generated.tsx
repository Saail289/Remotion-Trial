import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

export const GeneratedVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene 1: Spotlight bloom and red liquid rising
  const spotlightOpacity = interpolate(frame, [0, 30], [0, 0.7], clamp);
  const spotlightScale = interpolate(frame, [0, 40], [0.2, 1.5], clamp);
  const redLiquidY = interpolate(frame, [5, 45], [100, 0], clamp);
  const redLiquidOpacity = interpolate(frame, [5, 45], [0, 1], clamp);

  // Sparkling particles
  const particles = Array.from({ length: 25 }, (_, i) => {
    const seed = (i * 7 + 3) % 100;
    const x = (seed * 9.7) % 100;
    const size = 2 + (seed % 3);
    const speed = 0.4 + (seed % 5) * 0.15;
    const startFrame = (seed * 1.3) % 40;
    const yPos = interpolate(frame, [startFrame, startFrame + 120], [110, -10], clamp);
    const pOpacity = interpolate(frame, [startFrame, startFrame + 10, startFrame + 100, startFrame + 120], [0, 0.8, 0.8, 0], clamp);
    return { x, yPos, size, pOpacity, key: i };
  });

  // Scene 2: Bottle spring up
  const bottleSpring = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const bottleY = interpolate(bottleSpring, [0, 1], [600, 0], clamp);
  const bottleRotation = interpolate(bottleSpring, [0, 1], [10, -5], clamp);
  const bottleOpacity = interpolate(frame, [40, 45], [0, 1], clamp);

  // Halo pulse
  const haloOpacity = frame >= 50 ? 0.15 + 0.125 * (1 + Math.sin(frame / 8)) : 0;

  // Condensation droplets
  const droplets = Array.from({ length: 8 }, (_, i) => {
    const offsetX = -40 + (i * 11) % 80;
    const startF = 55 + i * 7;
    const dropY = interpolate(frame, [startF, startF + 60], [-80, 120], clamp);
    const dropOp = interpolate(frame, [startF, startF + 5, startF + 50, startF + 60], [0, 0.6, 0.5, 0], clamp);
    return { offsetX, dropY, dropOp, key: i };
  });

  // Scene 3: Text callouts
  const textLines = [
    { text: 'Real Taste', size: 52, weight: 'bold' as const, italic: false, delay: 110 },
    { text: 'Since 1886', size: 32, weight: '300' as const, italic: false, delay: 122 },
    { text: 'Open Happiness', size: 36, weight: 'normal' as const, italic: true, delay: 134 },
  ];

  const textCallouts = textLines.map((line, i) => {
    const pillOpacity = interpolate(frame, [line.delay - 6, line.delay], [0, 0.85], clamp);
    const textSpring = spring({
      frame: Math.max(0, frame - line.delay),
      fps,
      config: { damping: 12, stiffness: 120 },
    });
    const textX = interpolate(textSpring, [0, 1], [300, 0], clamp);
    const textOp = interpolate(textSpring, [0, 1], [0, 1], clamp);

    const underlineProgress = i === 0
      ? interpolate(frame, [line.delay + 6, line.delay + 18], [0, 100], clamp)
      : 0;

    return { ...line, pillOpacity, textX, textOp, underlineProgress, key: i };
  });

  // Scene 4: Bottle scale, background transition, wordmark
  const bottleScale4 = interpolate(frame, [120, 150], [1, 1.06], clamp);
  const bgRedTransition = interpolate(frame, [120, 145], [0, 1], clamp);

  const wordmarkSpring = spring({
    frame: Math.max(0, frame - 125),
    fps,
    config: { damping: 200, stiffness: 300 },
  });
  const wordmarkScale = interpolate(wordmarkSpring, [0, 1], [0, 1], clamp);
  const wordmarkOpacity = interpolate(frame, [125, 130], [0, 1], clamp);

  const subTextOpacity = interpolate(frame, [132, 138], [0, 1], clamp);

  // Final fade to black
  const finalFade = interpolate(frame, [130, 150], [1, 0], clamp);

  // Background color blend
  const bgR = Math.round(interpolate(bgRedTransition, [0, 1], [0, 204], clamp));
  const bgG = 0;
  const bgB = 0;
  const backgroundColor = `rgb(${bgR},${bgG},${bgB})`;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Background layer */}
      <AbsoluteFill style={{ backgroundColor, opacity: finalFade }}>

        {/* Spotlight */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 600,
            height: 600,
            marginLeft: -300,
            marginTop: -300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
            opacity: spotlightOpacity,
            transform: `scale(${spotlightScale})`,
          }}
        />

        {/* Red liquid rising */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to top, #F40009 0%, #F40009 60%, transparent 100%)',
            transform: `translateY(${redLiquidY}%)`,
            opacity: redLiquidOpacity * interpolate(frame, [45, 80], [1, 0.3], clamp),
          }}
        />

        {/* Sparkling particles */}
        {particles.map((p) => (
          <div
            key={p.key}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.yPos}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.9)',
              opacity: p.pOpacity,
              boxShadow: '0 0 4px rgba(255,255,255,0.6)',
            }}
          />
        ))}

        {/* Halo behind bottle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 500,
            height: 500,
            marginLeft: -250,
            marginTop: -250,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 60%)',
            opacity: haloOpacity,
          }}
        />

        {/* Bottle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${bottleY}px) rotate(${bottleRotation}deg) scale(${bottleScale4})`,
            opacity: bottleOpacity,
            zIndex: 10,
          }}
        >
          <Img
            src={staticFile('/assets/1773745582481_Coca_Cola_Flasche_-_Original_Taste.jpg')}
            style={{
              height: 500,
              objectFit: 'contain',
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))',
            }}
          />

          {/* Condensation droplets */}
          {droplets.map((d) => (
            <div
              key={d.key}
              style={{
                position: 'absolute',
                left: `calc(50% + ${d.offsetX}px)`,
                top: `calc(20% + ${d.dropY}px)`,
                width: 4,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.7)',
                opacity: d.dropOp,
                boxShadow: '0 1px 2px rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>

        {/* Text callouts - Scene 3 */}
        <div
          style={{
            position: 'absolute',
            right: 60,
            top: '30%',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            zIndex: 20,
          }}
        >
          {textCallouts.map((c) => (
            <div
              key={c.key}
              style={{
                position: 'relative',
                transform: `translateX(${c.textX}px)`,
                opacity: c.textOp,
              }}
            >
              {/* Red pill background */}
              <div
                style={{
                  position: 'absolute',
                  inset: -8,
                  borderRadius: 8,
                  backgroundColor: '#F40009',
                  opacity: c.pillOpacity * 0.85,
                }}
              />
              <div
                style={{
                  position: 'relative',
                  color: '#FFFFFF',
                  fontSize: c.size,
                  fontWeight: c.weight,
                  fontStyle: c.italic ? 'italic' : 'normal',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  padding: '4px 16px',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.text}
                {c.underlineProgress > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 16,
                      height: 3,
                      width: `${c.underlineProgress}%`,
                      backgroundColor: '#F40009',
                      borderRadius: 2,
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Scene 4: Wordmark */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 0,
            width: '100%',
            textAlign: 'center',
            zIndex: 30,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              transform: `scale(${wordmarkScale})`,
              opacity: wordmarkOpacity,
              color: '#FFFFFF',
              fontSize: 72,
              fontWeight: 'bold',
              fontFamily: 'Georgia, serif',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              letterSpacing: 2,
            }}
          >
            Coca-Cola
          </div>
          <div
            style={{
              marginTop: 8,
              color: '#FFFFFF',
              fontSize: 28,
              fontWeight: '300',
              fontFamily: 'Arial, Helvetica, sans-serif',
              opacity: subTextOpacity,
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            The Real Thing
          </div>
        </div>
      </AbsoluteFill>

      {/* Final black overlay for fade out */}
      <AbsoluteFill
        style={{
          backgroundColor: '#000000',
          opacity: interpolate(frame, [130, 150], [0, 1], clamp),
          zIndex: 100,
        }}
      />
    </AbsoluteFill>
  );
};