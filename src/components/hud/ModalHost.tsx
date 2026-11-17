import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSkyStore } from '../../store/useSkyStore';
import { MemoryJarDrawer } from './MemoryJarDrawer';
import { MemoryDetailModal } from './MemoryDetailModal';

export const ModalHost: React.FC = () => {
  const activeModal = useSkyStore((state) => state.activeModal);

  return (
    <AnimatePresence mode="wait">
      {activeModal.type === 'jar' && <MemoryJarDrawer key="modal-jar" />}
      {activeModal.type === 'memory' && (
        <MemoryDetailModal
          key={`modal-memory-${activeModal.starId}`}
          starId={activeModal.starId}
        />
      )}
    </AnimatePresence>
  );
};
