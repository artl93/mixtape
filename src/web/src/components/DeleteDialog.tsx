import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';

interface DeleteDialogProps {
  open: boolean;
  onCancel: () => void;
  onDelete: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ open, onCancel, onDelete }) => (
  <Dialog open={open} onClose={onCancel}>
    <DialogTitle>Confirm Delete</DialogTitle>
    <DialogContent>
      Are you sure you want to delete this track? This cannot be undone.
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} startIcon={<CancelIcon />}>
        Cancel
      </Button>
      <Button color="error" onClick={onDelete} startIcon={<DeleteIcon />}>
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteDialog;
