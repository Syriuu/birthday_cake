/* src/models/giftbox.tsx */
import { useState, useMemo, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import * as THREE from "three";

type GiftBoxProps = ThreeElements['group'] & {
  onOpen?: () => void; // Callback báo cho App biết hộp đã mở
};

export function GiftBox({ onOpen, ...props }: GiftBoxProps) {
  const { scene } = useGLTF("/giftbox.glb");
  // Clone scene để mỗi hộp quà là một object riêng biệt, không bị trùng lặp
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // --- LẤY CÁC PHẦN CỦA HỘP ---
  const lidPartNames = [
    "Cube001", "Torus", "Cylinder", "Cube002", "Cube003", 
    "Cube004", "Cube005", "Cube006", "Cube007", "Cube008", 
    "Cube009", "Cube010", "Cube011", "Cube012", "Cube013"
  ];
  const bodyPartNames = ["Cube_Body_0"];

  const findParts = (names: string[]) => {
    const parts: THREE.Object3D[] = [];
    names.forEach(name => {
      const obj = clonedScene.getObjectByName(name);
      if (obj) parts.push(obj);
    });
    return parts;
  };

  const lidParts = useMemo(() => findParts(lidPartNames), [clonedScene]);
  const bodyParts = useMemo(() => findParts(bodyPartNames), [clonedScene]);
  
  // Lưu kích thước gốc ban đầu của các bộ phận
  const originalScales = useRef(new Map<string, THREE.Vector3>());

  useEffect(() => {
    const allParts = [...lidParts, ...bodyParts];
    if (allParts.length > 0 && originalScales.current.size === 0) {
      allParts.forEach(part => {
        originalScales.current.set(part.uuid, part.scale.clone());
      });
    }
  }, [lidParts, bodyParts]);

  // --- STATE ---
  const [isOpen, setIsOpen] = useState(false);
  
  // Biến tham chiếu lưu tỉ lệ scale hiện tại (1 = to, 0 = biến mất)
  const currentScaleRef = useRef(1);

  // --- ANIMATION LOOP (Chạy mỗi khung hình) ---
  useFrame((state, delta) => {
    // 1. Xác định mục tiêu: Mở thì về 0, Đóng thì là 1
    const targetScale = isOpen ? 0 : 1;

    // 2. Dùng hàm lerp để chạy từ từ giá trị hiện tại về giá trị mục tiêu
    // Tốc độ 10 * delta giúp animation mượt mà
    currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetScale, 10 * delta);

    const scale = currentScaleRef.current;

    // 3. Áp dụng scale vào từng bộ phận
    [...lidParts, ...bodyParts].forEach(part => {
      const original = originalScales.current.get(part.uuid);
      if (original) {
        part.scale.copy(original).multiplyScalar(scale);
        
        // Tối ưu: Nếu nhỏ quá thì ẩn luôn cho nhẹ máy
        part.visible = scale > 0.01; 
      }
    });
  });

  return (
    <group
      {...props}
      dispose={null}
      onClick={(e) => {
        e.stopPropagation();
        // Console log để kiểm tra xem có click được không
        console.log("GiftBox Clicked!", isOpen); 
        
        if (!isOpen) {
          setIsOpen(true);
          onOpen?.(); // Báo ra ngoài là đã mở
        }
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload("/giftbox.glb");