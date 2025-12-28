// @ts-nocheck
/* src/models/GiftBox.tsx */
import { useState, useMemo, useEffect, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated, config } from "@react-spring/three";
import * as THREE from "three";

export function GiftBox(props) {
  const { scene } = useGLTF("/giftbox.glb");
  const cardTexture = useTexture("/card.png"); // Ảnh mặt trước

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // --- 1. ĐỊNH NGHĨA CÁC BỘ PHẬN ---
  
  // Nhóm 1: Nắp và Nơ (Biến mất trước)
  const lidPartNames = [
    "Cube001", "Torus", "Cylinder",
    "Cube002", "Cube003", "Cube004", "Cube005", "Cube006",
    "Cube007", "Cube008", "Cube009", "Cube010", "Cube011",
    "Cube012", "Cube013"
  ];

  // Nhóm 2: Thân hộp (Biến mất sau)
  // Dựa vào console log: "Cube_Body_0" là mesh thân hộp
  const bodyPartNames = ["Cube_Body_0"];

  // Hàm tìm object trong scene
  const findParts = (names) => {
    const parts = [];
    names.forEach(name => {
      const obj = clonedScene.getObjectByName(name);
      if (obj) parts.push(obj);
    });
    return parts;
  };

  const lidParts = useMemo(() => findParts(lidPartNames), [clonedScene]);
  const bodyParts = useMemo(() => findParts(bodyPartNames), [clonedScene]);

  // Lưu kích thước gốc
  const originalScales = useRef(new Map());

  useEffect(() => {
    // Lưu scale cho cả nắp và thân
    const allParts = [...lidParts, ...bodyParts];
    if (allParts.length > 0 && originalScales.current.size === 0) {
      allParts.forEach(part => {
        originalScales.current.set(part.uuid, part.scale.clone());
      });
    }
  }, [lidParts, bodyParts]);

  // --- STATE VÀ ANIMATION ---
  const [isOpen, setIsOpen] = useState(false);       
  const [isFlipped, setIsFlipped] = useState(false); 

  // 1. Animation Nắp (Mất ngay lập tức)
  const { lidProgress } = useSpring({
    lidProgress: isOpen ? 0 : 1,
    config: { tension: 200, friction: 20 },
  });

  // 2. Animation Thân (Mất sau 500ms)
  const { bodyProgress } = useSpring({
    bodyProgress: isOpen ? 0 : 1,
    delay: isOpen ? 500 : 0, // 👇 ĐỘ TRỄ: Chờ 500ms (0.5s) mới bắt đầu thu nhỏ
    config: { tension: 200, friction: 20 },
  });

  // 3. Animation Thẻ (Bay lên)
  const { cardY, cardOpacity } = useSpring({
    cardY: isOpen ? 1.5 : 0.2,
    cardOpacity: isOpen ? 1 : 0,
    config: config.wobbly,
  });

  // 4. Animation Lật Thẻ
  const { cardRotationY } = useSpring({
    cardRotationY: isFlipped ? Math.PI : 0, 
    config: { mass: 1, tension: 170, friction: 26 },
  });

  // --- LOOP XỬ LÝ KHUNG HÌNH ---
  useFrame(() => {
    const lProgress = lidProgress.get();
    const bProgress = bodyProgress.get();

    // Xử lý nhóm Nắp
    lidParts.forEach(part => {
      const original = originalScales.current.get(part.uuid);
      if (original) {
        part.scale.copy(original).multiplyScalar(lProgress);
        part.visible = lProgress > 0.01;
      }
    });

    // Xử lý nhóm Thân (Riêng biệt)
    bodyParts.forEach(part => {
      const original = originalScales.current.get(part.uuid);
      if (original) {
        part.scale.copy(original).multiplyScalar(bProgress);
        part.visible = bProgress > 0.01;
      }
    });
  });

  return (
    <group
      {...props}
      dispose={null}
      onClick={(e) => {
        e.stopPropagation();
        if (!isOpen) setIsOpen(true);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      {/* --- TẤM THIỆP (Luôn tồn tại và tương tác được) --- */}
      <animated.group
        position-y={cardY}
        rotation-y={cardRotationY}
        position-z={0}
        scale={0.8}
        onClick={(e) => {
          e.stopPropagation();
          // Chỉ lật khi hộp đã mở (hoặc đang mở)
          if (isOpen) setIsFlipped(!isFlipped);
        }}
      >
        {/* MẶT TRƯỚC: Ảnh */}
        <mesh>
          <planeGeometry args={[1.5, 1]} />
          <meshStandardMaterial map={cardTexture} side={THREE.FrontSide} />
        </mesh>

        {/* MẶT SAU: Màu hồng + Lời chúc (hoặc ảnh) */}
        <mesh rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.5, 1]} />
          <meshStandardMaterial color="#ffc0cb" side={THREE.FrontSide} />
        </mesh>
      </animated.group>

      {/* --- MÔ HÌNH HỘP QUÀ --- */}
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/giftbox.glb");
useTexture.preload("/card.png");