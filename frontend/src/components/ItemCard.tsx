import { 
  Box, 
  Button, 
  ButtonGroup, 
  TextField, 
  Typography,
  Divider,
  Chip,
  Paper
} from '@mui/material';
import type { AuditItem } from '../types';
import { NOTE_LABELS } from '../types';
import { useAuditStore } from '../store/auditStore';
import InfoIcon from '@mui/icons-material/Info';
import PhotoUpload from './PhotoUpload';
import PhotoGallery from './PhotoGallery';

interface ItemCardProps {
  item: AuditItem;
  categoryId: string;
}

export default function ItemCard({ item, categoryId }: ItemCardProps) {
  const { updateItemNonConformities, updateItemComment, addPhoto, removePhoto } = useAuditStore();

  const handleNonConformitiesChange = async (numberOfNonConformities: number) => {
    await updateItemNonConformities(categoryId, item.id, numberOfNonConformities);
  };

  const handleCommentChange = async (comment: string) => {
    await updateItemComment(categoryId, item.id, comment);
  };

  const getNoteColor = (note?: number) => {
    if (note === undefined) return 'default';
    if (note === 1.0) return 'success';
    if (note === 0.7) return 'info';
    if (note === 0.3) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Info Section */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          icon={<InfoIcon />}
          label={`Pondération: ${item.ponderation}`}
          size="small"
          variant="outlined"
        />
        {item.note !== undefined && (
          <Chip
            label={`Note: ${item.note} (${NOTE_LABELS[item.note]})`}
            color={getNoteColor(item.note) as any}
            size="small"
          />
        )}
      </Box>

      {/* Non-Conformités Selection */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Nombre de non-conformités ({item.classification === 'binary' ? 'Binaire' : 'Multiple'}) :
        </Typography>
        {item.classification === 'binary' ? (
          <ButtonGroup variant="outlined" fullWidth>
            <Button
              variant={item.numberOfNonConformities === 0 ? 'contained' : 'outlined'}
              onClick={() => handleNonConformitiesChange(0)}
              color="success"
            >
              Conforme (0)
            </Button>
            <Button
              variant={item.numberOfNonConformities === 1 ? 'contained' : 'outlined'}
              onClick={() => handleNonConformitiesChange(1)}
              color="error"
            >
              Non-conforme (1)
            </Button>
          </ButtonGroup>
        ) : (
          <ButtonGroup variant="outlined" fullWidth>
            <Button
              variant={item.numberOfNonConformities === 0 ? 'contained' : 'outlined'}
              onClick={() => handleNonConformitiesChange(0)}
              color="success"
            >
              Conforme (0)
            </Button>
            <Button
              variant={item.numberOfNonConformities === 1 ? 'contained' : 'outlined'}
              onClick={() => handleNonConformitiesChange(1)}
              color="info"
            >
              Mineur (1)
            </Button>
            <Button
              variant={item.numberOfNonConformities === 2 ? 'contained' : 'outlined'}
              onClick={() => handleNonConformitiesChange(2)}
              color="warning"
            >
              Moyen (2)
            </Button>
            <Button
              variant={item.numberOfNonConformities >= 3 ? 'contained' : 'outlined'}
              onClick={() => handleNonConformitiesChange(3)}
              color="error"
            >
              Majeur (≥3)
            </Button>
          </ButtonGroup>
        )}
        {item.note !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Note calculée : {item.note} ({NOTE_LABELS[item.note]})
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Observations */}
      {item.observations.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Observations possibles :
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {item.observations.map((obs) => (
              <Paper key={obs.id} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ mb: obs.action ? 1 : 0 }}>
                  {obs.text}
                </Typography>
                {obs.action && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Action : {obs.action}
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      <Divider />

      {/* Comments */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Commentaires :
        </Typography>
        <TextField
          multiline
          rows={4}
          value={item.comments}
          onChange={(e) => handleCommentChange(e.target.value)}
          fullWidth
          placeholder="Ajoutez vos commentaires ici..."
          variant="outlined"
        />
      </Box>

      <Divider />

      {/* Photos */}
      <Box>
        <PhotoUpload
          onPhotoAdded={(photoBase64) => addPhoto(categoryId, item.id, photoBase64)}
        />
        {item.photos.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <PhotoGallery
              photos={item.photos}
              onDelete={(index) => removePhoto(categoryId, item.id, index)}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
