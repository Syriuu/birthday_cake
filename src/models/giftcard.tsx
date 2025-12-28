/* src/models/GiftCard.tsx */
import { useState, useMemo, useEffect, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";

type GiftCardProps = ThreeElements['group'] & {
  image: string;      
  isEnabled: boolean; 
};

export function GiftCard({ image, isEnabled, ...props }: GiftCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cardTexture = useTexture(image);
  const { camera } = useThree();

  useEffect(() => {
    cardTexture.colorSpace = THREE.SRGBColorSpace;
    cardTexture.anisotropy = 4;
    cardTexture.needsUpdate = true;
  }, [cardTexture]);

  const [isInspecting, setIsInspecting] = useState(false);

  // --- BIẾN TẠM TÍNH TOÁN ---
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpDir = useMemo(() => new THREE.Vector3(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);

  // --- LOGIC DI CHUYỂN ---
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const card = groupRef.current;
    const parent = card.parent;

    if (isInspecting && parent) {
      // 1. CẦM LÊN: Bay đến trước mặt
      tmpPos.copy(camera.position);
      camera.getWorldDirection(tmpDir);
      tmpPos.add(tmpDir.multiplyScalar(1.2)); 

      parent.worldToLocal(tmpPos);
      targetPos.copy(tmpPos);

      // Xoay mặt thiệp về phía mình
      tmpQuat.copy(camera.quaternion);
      const parentInverse = parent.quaternion.clone().invert();
      targetQuat.copy(parentInverse).multiply(tmpQuat);
    } else {
      // 2. THẢ RA: Nằm bẹp trên bàn
      targetPos.set(0, 20, 0); 
      
      // 👇 GÓC XOAY ĐÃ SỬA:
      // -90 độ trục X (nằm ngửa)
      // 0.2 trục Z (hơi nghiêng cho tự nhiên)
      targetQuat.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.2)); 
    }

    const speed = isInspecting ? 12 : 8;
    
    card.position.lerp(targetPos, delta * speed);
    card.quaternion.slerp(targetQuat, delta * speed);
  });

  const CARD_WIDTH = 1.6;
  const CARD_HEIGHT = 1.2;

  return (
    <group 
      ref={groupRef}
      {...props} 
      onClick={(e) => {
        e.stopPropagation();
        if (isEnabled) {
          setIsInspecting(!isInspecting);
        }
      }}
      onPointerOver={() => {
        if (isEnabled) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
        {/* LỚP 1: ẢNH */}
        <mesh castShadow receiveShadow>
          <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
          <meshStandardMaterial 
            map={cardTexture} 
            roughness={0.4}
            metalness={0.05}
            toneMapped={false}
            side={THREE.FrontSide}
            transparent={true} 
          />
        </mesh>

        {/* LỚP 2: MẶT SAU */}
        <mesh position={[0, 0, -0.001]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
          <meshStandardMaterial color="#f7f2ff" side={THREE.FrontSide} />
        </mesh>
    </group>
  );
}