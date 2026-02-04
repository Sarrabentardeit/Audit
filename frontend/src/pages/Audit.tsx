import { useState } from 'react';
import { Typography, Box, Paper, Chip, Button, CircularProgress } from '@mui/material';
import { useAuditStore } from '../store/auditStore';
import CategoryCard from '../components/CategoryCard';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { generatePDFReport } from '../utils/pdfExport';

export default function Audit() {
  const navigate = useNavigate();
  const { currentAudit, results } = useAuditStore();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleExportPDF = async () => {
    if (!currentAudit || !results) return;
    
    setIsGeneratingPDF(true);
    try {
      await generatePDFReport(currentAudit, results);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!currentAudit) {
    return (
      <Layout>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Aucun audit en cours
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          >
            Retour à l'accueil
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
            >
              Retour
            </Button>
            {results && (
              <Button
                variant="contained"
                color="primary"
                startIcon={isGeneratingPDF ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
                onClick={handleExportPDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? 'Génération...' : 'Exporter en PDF'}
              </Button>
            )}
          </Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Audit d'Hygiène
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Chip label={`Date: ${currentAudit.dateExecution}`} />
            {currentAudit.adresse && (
              <Chip label={`Adresse: ${currentAudit.adresse}`} />
            )}
          </Box>
        </Box>

        {/* Results Dashboard */}
        {results && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 2,
            mb: 3 
          }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Score Total
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {results.totalScore.toFixed(1)}%
              </Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nombre de KO
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={results.numberOfKO > 0 ? 'error' : 'success'}
              >
                {results.numberOfKO}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Amendes Potentielles
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={results.potentialFines > 0 ? 'warning.main' : 'success'}
              >
                {results.potentialFines.toFixed(0)} €
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Categories */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {currentAudit.categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </Box>
      </Box>
    </Layout>
  );
}
