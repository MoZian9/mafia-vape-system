import { Drawer, List, ListItemButton, ListItemText } from '@mui/material';
import { useTranslation } from 'react-i18next';

export type PageKey = 'dashboard' | 'invoices' | 'inventory' | 'shifts' | 'password';

interface Props {
  open: boolean;
  onClose: () => void;
  page: PageKey;
  onChange: (page: PageKey) => void;
}

export default function MenuDrawer({ open, onClose, page, onChange }: Props) {
  const { t } = useTranslation();
  const items: PageKey[] = ['dashboard', 'invoices', 'inventory', 'shifts', 'password'];
  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ className: 'menu-drawer-paper' }}>
      <List sx={{ width: 280, p: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item}
            selected={page === item}
            onClick={() => {
              onChange(item);
              onClose();
            }}
            sx={{
              borderRadius: 2,
              color: '#fff',
              '& .MuiListItemText-primary': { color: '#fff', fontWeight: 700 },
              '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.14)' },
              '&.Mui-selected:hover, &:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <ListItemText primary={t(item)} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
