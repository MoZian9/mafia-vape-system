import { Box } from '@mui/material';
import { useRef } from 'react';

interface Props {
  onBypass: () => void;
  className?: string;
}

export default function HiddenBypassDot({ onBypass, className }: Props) {
  const taps = useRef(0);
  const timer = useRef<number | null>(null);

  const handleTap = () => {
    taps.current += 1;
    if (timer.current) window.clearTimeout(timer.current);
    if (taps.current >= 5) {
      taps.current = 0;
      onBypass();
      return;
    }
    timer.current = window.setTimeout(() => {
      taps.current = 0;
    }, 1200);
  };

  return <Box className={className || 'hidden-dot'} onClick={handleTap} />;
}
