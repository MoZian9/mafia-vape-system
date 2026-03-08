import { Box, IconButton, Typography } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';

interface Props {
  version: string;
  onMenu: () => void;
}

export default function TitleBar({ version, onMenu }: Props) {
  return (
    <Box className="title-bar">
      <Box className="title-bar__left">
        <IconButton size="small" onClick={onMenu} sx={{ color: '#fff' }}>
          <MenuIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" fontWeight={700} sx={{ color: '#fff' }}>Mafia Vape</Typography>
      </Box>
      <Box className="title-bar__center">
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>v{version}</Typography>
      </Box>
      <Box className="title-bar__right">
        <IconButton size="small" sx={{ color: '#fff' }} onClick={() => window.desktopAPI.minimize()}><RemoveIcon fontSize="small" /></IconButton>
        <IconButton size="small" sx={{ color: '#fff' }} onClick={() => window.desktopAPI.maximizeToggle()}><CropSquareIcon fontSize="small" /></IconButton>
        <IconButton size="small" color="error" onClick={() => window.desktopAPI.close()}><CloseIcon fontSize="small" /></IconButton>
      </Box>
    </Box>
  );
}
