import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { AuditCategory } from '../types';
import ItemCard from './ItemCard';
import { useAuditStore } from '../store/auditStore';
import { useMemo } from 'react';

interface CategoryCardProps {
  category: AuditCategory;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { results } = useAuditStore();

  const categoryScore = useMemo(() => {
    if (!results) return 0;
    return results.categoryScores[category.id] || 0;
  }, [results, category.id]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'info';
    if (score >= 50) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {category.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {category.items.length} item(s)
            </Typography>
          </Box>
          <Chip
            label={`${categoryScore.toFixed(0)}%`}
            color={getScoreColor(categoryScore) as any}
          />
        </Box>

        {results && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={categoryScore}
              color={getScoreColor(categoryScore) as any}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {category.items.map((item) => (
            <Accordion key={item.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="body1" sx={{ flex: 1 }}>
                    {item.name}
                  </Typography>
                  {item.note !== undefined && (
                    <Chip
                      label={item.note === 1.0 ? 'Conforme' : item.note === 0.7 ? 'Mineur' : item.note === 0.3 ? 'Moyen' : 'Majeur'}
                      size="small"
                      color={
                        item.note === 1.0 ? 'success' :
                        item.note === 0.7 ? 'info' :
                        item.note === 0.3 ? 'warning' : 'error'
                      }
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <ItemCard item={item} categoryId={category.id} />
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
