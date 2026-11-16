import { useEffect, useRef } from 'react';

export default function Avatar3D({ 
  avatarState = 'idle', // 'idle' | 'listening' | 'thinking' | 'speaking'
  speechVolume = 0.5,
  className = ''
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const targetHeadRotRef = useRef({ yaw: 0, pitch: 0 });
  const currentHeadRotRef = useRef({ yaw: 0, pitch: 0 });
  
  // Biological blink timing
  const blinkRef = useRef({
    isBlinking: false,
    blinkProgress: 0,
    nextBlinkTime: 0
  });

  // Handle subtle mouse tracking
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mousePosRef.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (blinkRef.current.nextBlinkTime === 0) {
      blinkRef.current.nextBlinkTime = Date.now() + 2500;
    }

    let startTime = Date.now();

    const render = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;

      // Handle Canvas size & Retina scaling
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height * 0.44;

      // Update natural blinking
      if (!blinkRef.current.isBlinking && now > blinkRef.current.nextBlinkTime) {
        blinkRef.current.isBlinking = true;
        blinkRef.current.blinkProgress = 0;
      }
      if (blinkRef.current.isBlinking) {
        blinkRef.current.blinkProgress += 0.14;
        if (blinkRef.current.blinkProgress >= 1) {
          blinkRef.current.isBlinking = false;
          blinkRef.current.blinkProgress = 0;
          blinkRef.current.nextBlinkTime = now + 2800 + Math.random() * 3200;
        }
      }

      // Smooth Head Tracking with Organic Idle Drift
      const organicDriftX = Math.sin(elapsed * 0.8) * 0.08;
      const organicDriftY = Math.cos(elapsed * 0.6) * 0.05;

      let targetYaw = mousePosRef.current.x * 0.18 + organicDriftX;
      let targetPitch = mousePosRef.current.y * 0.12 + organicDriftY;

      // State based head posturing
      if (avatarState === 'listening') {
        targetPitch += 0.06; // Empathetic listening lean forward
        targetYaw *= 0.5;
      } else if (avatarState === 'thinking') {
        targetYaw += 0.12;
        targetPitch -= 0.08; // Pondering glance
      } else if (avatarState === 'speaking') {
        targetPitch += Math.sin(elapsed * 4.5) * 0.03; // Gentle speech nod
      }

      targetHeadRotRef.current = { yaw: targetYaw, pitch: targetPitch };
      currentHeadRotRef.current.yaw += (targetHeadRotRef.current.yaw - currentHeadRotRef.current.yaw) * 0.08;
      currentHeadRotRef.current.pitch += (targetHeadRotRef.current.pitch - currentHeadRotRef.current.pitch) * 0.08;

      const yaw = currentHeadRotRef.current.yaw;
      const pitch = currentHeadRotRef.current.pitch;

      // Natural breathing oscillation (ribcage & shoulders rise and fall)
      const breathing = Math.sin(elapsed * 1.5) * 4;

      // Clear Canvas with Warm Neutral Atmosphere
      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 1. BACKGROUND AURA / DEPTH GLOW
      // -------------------------------------------------------------
      ctx.save();
      const auraColor = avatarState === 'listening' ? '#737D45' : (avatarState === 'speaking' ? '#F4C6A6' : '#FAF4ED');
      ctx.beginPath();
      ctx.arc(centerX, centerY, 130, 0, Math.PI * 2);
      ctx.fillStyle = auraColor;
      ctx.globalAlpha = avatarState === 'listening' ? 0.22 : 0.4;
      ctx.fill();
      ctx.restore();

      // -------------------------------------------------------------
      // 2. TORSO & MEDICAL NURSE UNIFORM (Olive Green #737D45)
      // -------------------------------------------------------------
      ctx.save();
      ctx.translate(centerX, centerY + 130 + breathing);

      // Shoulders base
      ctx.beginPath();
      ctx.moveTo(-120, 90);
      ctx.quadraticCurveTo(-110, 0, -45, -25);
      ctx.lineTo(45, -25);
      ctx.quadraticCurveTo(110, 0, 120, 90);
      ctx.lineTo(-120, 90);
      ctx.fillStyle = '#737D45'; // Olive Green uniform
      ctx.fill();

      // Deep Olive side contouring & 3D shadow
      ctx.beginPath();
      ctx.moveTo(-120, 90);
      ctx.quadraticCurveTo(-110, 0, -45, -25);
      ctx.lineTo(-30, 90);
      ctx.fillStyle = '#465132'; // Deep Olive
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // V-neck collar lining (Warm Peach / Ivory)
      ctx.beginPath();
      ctx.moveTo(-35, -24);
      ctx.lineTo(0, 32);
      ctx.lineTo(35, -24);
      ctx.lineTo(24, -24);
      ctx.lineTo(0, 20);
      ctx.lineTo(-24, -24);
      ctx.closePath();
      ctx.fillStyle = '#FFF9F3';
      ctx.fill();

      // Nurse Name Badge ("हृदय • Ananya")
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(40, 15, 52, 22, 4);
      ctx.fill();
      ctx.strokeStyle = '#E0D2C0';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#465132';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('ANANYA', 46, 28);
      ctx.fillStyle = '#737D45';
      ctx.font = '7px sans-serif';
      ctx.fillText('Wellness Nurse', 46, 35);

      // Stethoscope around neck
      ctx.strokeStyle = '#292D24'; // Stethoscope dark tubing
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // Left tubing loop
      ctx.beginPath();
      ctx.moveTo(-32, -35);
      ctx.quadraticCurveTo(-55, 30, -20, 55);
      ctx.stroke();

      // Right tubing loop
      ctx.beginPath();
      ctx.moveTo(32, -35);
      ctx.quadraticCurveTo(55, 30, -18, 55);
      ctx.stroke();

      // Silver Stethoscope chest-piece (diaphragm)
      ctx.beginPath();
      ctx.arc(-18, 56, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#D9D9D9';
      ctx.fill();
      ctx.strokeStyle = '#465132';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-18, 56, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#737D45';
      ctx.fill();

      ctx.restore();

      // -------------------------------------------------------------
      // 3. NECK & JAW ANCHOR
      // -------------------------------------------------------------
      ctx.save();
      ctx.translate(centerX + yaw * 10, centerY + 85 + pitch * 8 + breathing * 0.5);

      // Neck
      ctx.beginPath();
      ctx.moveTo(-22, -30);
      ctx.lineTo(-24, 25);
      ctx.quadraticCurveTo(0, 32, 24, 25);
      ctx.lineTo(22, -30);
      ctx.closePath();
      ctx.fillStyle = '#E8BD9E'; // Neck skin base
      ctx.fill();

      // Shadow under jaw
      ctx.beginPath();
      ctx.moveTo(-22, -30);
      ctx.quadraticCurveTo(0, -15, 22, -30);
      ctx.lineTo(22, -22);
      ctx.quadraticCurveTo(0, -10, -22, -22);
      ctx.fillStyle = '#C89A7B';
      ctx.globalAlpha = 0.45;
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.restore();

      // -------------------------------------------------------------
      // 4. HEAD, FACE, EYES, AND HAIR (3D Rotated & Shaded)
      // -------------------------------------------------------------
      ctx.save();
      ctx.translate(centerX + yaw * 30, centerY + pitch * 20);
      ctx.rotate(yaw * 0.2);

      // Back Hair (Neat Nurse Bun)
      ctx.beginPath();
      ctx.arc(0, -58, 48, 0, Math.PI * 2);
      ctx.fillStyle = '#2A201A'; // Deep warm brown hair
      ctx.fill();

      // Subtle bun highlight
      ctx.beginPath();
      ctx.arc(-8, -65, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#3F3229';
      ctx.fill();

      // Face Oval (Warm, Natural, Friendly Skin)
      ctx.beginPath();
      ctx.moveTo(-52, -28);
      ctx.bezierCurveTo(-54, -75, 54, -75, 52, -28);
      ctx.bezierCurveTo(50, 25, 28, 68, 0, 72);
      ctx.bezierCurveTo(-28, 68, -50, 25, -52, -28);
      ctx.closePath();
      ctx.fillStyle = '#F4C6A6'; // Warm Peach Skin Tone
      ctx.fill();

      // 3D Soft Cheek Contours & Ambient Lighting
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#E09875';
      // Left cheek blush
      ctx.beginPath();
      ctx.ellipse(-26, 12, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right cheek blush
      ctx.beginPath();
      ctx.ellipse(26, 12, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Nose: subtle, clean, friendly
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(yaw * 6, 12);
      ctx.quadraticCurveTo(0, 16, -yaw * 3, 15);
      ctx.strokeStyle = '#C98C6A';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Eyebrows (Empathetic, Soft Arch)
      const browLift = avatarState === 'listening' ? -3 : (avatarState === 'thinking' ? -2 : 0);
      ctx.strokeStyle = '#2A201A';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      // Left eyebrow
      ctx.beginPath();
      ctx.moveTo(-36, -20 + browLift);
      ctx.quadraticCurveTo(-24, -27 + browLift, -12, -21 + browLift);
      ctx.stroke();

      // Right eyebrow
      ctx.beginPath();
      ctx.moveTo(12, -21 + browLift);
      ctx.quadraticCurveTo(24, -27 + browLift, 36, -20 + browLift);
      ctx.stroke();

      // -------------------------------------------------------------
      // EYES & NATURAL BLINKING
      // -------------------------------------------------------------
      const blinkFactor = blinkRef.current.isBlinking 
        ? Math.sin(blinkRef.current.blinkProgress * Math.PI) 
        : 0;

      const eyeHeight = Math.max(1, 10 * (1 - blinkFactor));

      // Left Eye
      ctx.save();
      ctx.translate(-24 + yaw * 4, -4);
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#4A3428';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Iris & Pupil (Hazel Brown)
      if (eyeHeight > 3) {
        ctx.beginPath();
        const eyeLookX = yaw * 3;
        const eyeLookY = pitch * 2;
        ctx.arc(eyeLookX, eyeLookY, 5.2, 0, Math.PI * 2);
        ctx.fillStyle = '#465132'; // Deep warm hazel
        ctx.fill();

        // Pupil
        ctx.beginPath();
        ctx.arc(eyeLookX, eyeLookY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#1A1412';
        ctx.fill();

        // Eye Light Reflection Specular
        ctx.beginPath();
        ctx.arc(eyeLookX - 1.5, eyeLookY - 1.5, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
      ctx.restore();

      // Right Eye
      ctx.save();
      ctx.translate(24 + yaw * 4, -4);
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#4A3428';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Iris & Pupil
      if (eyeHeight > 3) {
        ctx.beginPath();
        const eyeLookX = yaw * 3;
        const eyeLookY = pitch * 2;
        ctx.arc(eyeLookX, eyeLookY, 5.2, 0, Math.PI * 2);
        ctx.fillStyle = '#465132';
        ctx.fill();

        // Pupil
        ctx.beginPath();
        ctx.arc(eyeLookX, eyeLookY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#1A1412';
        ctx.fill();

        // Eye Light Reflection Specular
        ctx.beginPath();
        ctx.arc(eyeLookX - 1.5, eyeLookY - 1.5, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
      ctx.restore();

      // -------------------------------------------------------------
      // MOUTH & DYNAMIC SPEAKING ARTICULATION
      // -------------------------------------------------------------
      ctx.save();
      ctx.translate(0, 42);

      if (avatarState === 'speaking') {
        // Dynamic speaking lip articulation synced to audio oscillation
        const speakOpen = Math.abs(Math.sin(elapsed * 12) * Math.cos(elapsed * 6)) * 8 * speechVolume + 2;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, speakOpen, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#732A22';
        ctx.fill();

        // Teeth hint
        if (speakOpen > 4) {
          ctx.beginPath();
          ctx.rect(-7, -speakOpen * 0.7, 14, 3);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }

        // Lip outline
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.quadraticCurveTo(0, -speakOpen * 0.8 - 2, 14, 0);
        ctx.quadraticCurveTo(0, speakOpen * 0.8 + 2, -14, 0);
        ctx.strokeStyle = '#B85848';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Idle gentle, compassionate slight smile
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.quadraticCurveTo(0, 6, 14, 0);
        ctx.strokeStyle = '#B85848';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Subtle upper lip indent
        ctx.beginPath();
        ctx.moveTo(-10, -1);
        ctx.quadraticCurveTo(0, 1, 10, -1);
        ctx.strokeStyle = '#D47A6B';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();

      // -------------------------------------------------------------
      // FRONT HAIR & PROFESSIONAL STYLING
      // -------------------------------------------------------------
      ctx.beginPath();
      // Left front side-swept hair
      ctx.moveTo(-54, -28);
      ctx.quadraticCurveTo(-45, -78, 0, -68);
      ctx.quadraticCurveTo(-20, -48, -48, -20);
      ctx.closePath();
      ctx.fillStyle = '#2A201A';
      ctx.fill();

      // Right front side-swept hair
      ctx.beginPath();
      ctx.moveTo(54, -28);
      ctx.quadraticCurveTo(45, -78, 0, -68);
      ctx.quadraticCurveTo(20, -48, 48, -20);
      ctx.closePath();
      ctx.fillStyle = '#241B16';
      ctx.fill();

      // Hair highlights (Warm subtle luster)
      ctx.beginPath();
      ctx.moveTo(-35, -55);
      ctx.quadraticCurveTo(-15, -60, 5, -55);
      ctx.strokeStyle = '#4A382C';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.restore(); // Restore Head Transform

      // Next animation loop
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [avatarState, speechVolume]);

  return (
    <div className={`avatar-3d-wrapper ${className}`} onMouseMove={handleMouseMove}>
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        className="avatar-3d-canvas"
        aria-label="Interactive 3D Nurse Ananya Avatar"
      />
      {/* State Badge */}
      <div className={`avatar-status-pill status-${avatarState}`}>
        <span className="status-dot" />
        <span className="status-label">
          {avatarState === 'idle' && 'Nurse Ananya • Ready to Listen'}
          {avatarState === 'listening' && 'Listening to you...'}
          {avatarState === 'thinking' && 'Nurse Ananya is reflecting...'}
          {avatarState === 'speaking' && 'Speaking gently...'}
        </span>
      </div>
    </div>
  );
}
