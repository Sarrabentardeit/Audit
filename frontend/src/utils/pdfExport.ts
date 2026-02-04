import jsPDF from 'jspdf';
import type { Audit, AuditResults, RadarData } from '../types';

/**
 * Générer un rapport PDF à partir d'un audit
 */
export async function generatePDFReport(audit: Audit, results: AuditResults): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Fonction pour ajouter une nouvelle page si nécessaire
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Fonction pour ajouter du texte avec gestion de la pagination
  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    checkPageBreak(fontSize + 5);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color[0], color[1], color[2]);
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
    lines.forEach((line: string) => {
      checkPageBreak(fontSize + 2);
      pdf.text(line, margin, yPosition);
      yPosition += fontSize * 0.5 + 2;
    });
  };

  // En-tête
  pdf.setFillColor(25, 118, 210);
  pdf.rect(0, 0, pageWidth, 30, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RAPPORT D\'AUDIT D\'HYGIÈNE', pageWidth / 2, 20, { align: 'center' });
  
  yPosition = 40;
  pdf.setTextColor(0, 0, 0);

  // Informations de l'audit
  addText('Informations de l\'audit', 16, true);
  yPosition += 5;
  addText(`Date d'exécution : ${audit.dateExecution}`, 12);
  addText(`Adresse : ${audit.adresse}`, 12);
  addText(`Date de génération : ${new Date().toLocaleDateString('fr-FR')}`, 12);
  yPosition += 5;

  // Résultats synthétiques
  addText('Résultats synthétiques', 16, true);
  yPosition += 5;
  
  // Score total
  const scoreColor: [number, number, number] = 
    results.totalScore >= 90 ? [76, 175, 80] :
    results.totalScore >= 70 ? [33, 150, 243] :
    results.totalScore >= 50 ? [255, 152, 0] :
    [211, 47, 47];
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.text(`Score Total : ${results.totalScore.toFixed(1)}%`, margin, yPosition);
  yPosition += 8;
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.text(`Nombre de KO : ${results.numberOfKO}`, margin, yPosition);
  yPosition += 6;
  pdf.text(`Amendes Potentielles : ${results.potentialFines.toFixed(0)} €`, margin, yPosition);
  yPosition += 10;

  // Scores par catégorie
  addText('Scores par catégorie', 16, true);
  yPosition += 5;
  
  audit.categories.forEach((category, index) => {
    checkPageBreak(15);
    const categoryScore = results.categoryScores[category.id] || 0;
    const categoryColor: [number, number, number] = 
      categoryScore >= 90 ? [76, 175, 80] :
      categoryScore >= 70 ? [33, 150, 243] :
      categoryScore >= 50 ? [255, 152, 0] :
      [211, 47, 47];
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(categoryColor[0], categoryColor[1], categoryColor[2]);
    pdf.text(`${index + 1}. ${category.name}`, margin, yPosition);
    yPosition += 6;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`   Score : ${categoryScore.toFixed(1)}%`, margin + 5, yPosition);
    yPosition += 6;
    
    // Détails des items avec non-conformités
    const itemsWithIssues = category.items.filter(
      item => item.numberOfNonConformities > 0
    );
    
    if (itemsWithIssues.length > 0) {
      pdf.setFontSize(10);
      pdf.text('   Non-conformités détectées :', margin + 5, yPosition);
      yPosition += 5;
      
      itemsWithIssues.forEach((item) => {
        checkPageBreak(8);
        pdf.text(`   • ${item.name} (${item.numberOfNonConformities} non-conformité${item.numberOfNonConformities > 1 ? 's' : ''})`, margin + 10, yPosition);
        yPosition += 5;
        
        if (item.comments) {
          const commentLines = pdf.splitTextToSize(`     Commentaire : ${item.comments}`, pageWidth - 2 * margin - 10);
          commentLines.forEach((line: string) => {
            checkPageBreak(5);
            pdf.text(line, margin + 10, yPosition);
            yPosition += 4;
          });
        }
      });
      yPosition += 3;
    }
    
    yPosition += 3;
  });

  // Photos (si disponibles)
  const itemsWithPhotos = audit.categories.flatMap(cat => 
    cat.items.filter(item => item.photos.length > 0).map(item => ({
      category: cat.name,
      item: item.name,
      photos: item.photos,
    }))
  );

  if (itemsWithPhotos.length > 0) {
    yPosition += 5;
    addText('Photos', 16, true);
    yPosition += 5;

    for (const itemPhoto of itemsWithPhotos) {
      checkPageBreak(50);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${itemPhoto.category} - ${itemPhoto.item}`, margin, yPosition);
      yPosition += 6;

      // Ajouter les photos (une par page pour la qualité)
      for (let i = 0; i < itemPhoto.photos.length; i++) {
        checkPageBreak(60);
        
        try {
          const img = new Image();
          img.src = itemPhoto.photos[i];
          
          await new Promise<void>((resolve) => {
            img.onload = () => {
              const imgWidth = img.width;
              const imgHeight = img.height;
              const maxWidth = pageWidth - 2 * margin;
              const maxHeight = 50; // Hauteur max pour les photos dans le PDF
              
              let width = imgWidth;
              let height = imgHeight;
              
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
              
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
              
              pdf.addImage(itemPhoto.photos[i], 'JPEG', margin, yPosition, width, height);
              yPosition += height + 5;
              resolve();
            };
            img.onerror = () => {
              pdf.text('   [Erreur de chargement de la photo]', margin, yPosition);
              yPosition += 10;
              resolve();
            };
          });
        } catch (error) {
          pdf.text('   [Erreur de chargement de la photo]', margin, yPosition);
          yPosition += 10;
        }
      }
      
      yPosition += 5;
    }
  }

  // Pied de page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Page ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Télécharger le PDF
  pdf.save(`audit-hygiene-${audit.dateExecution}-${Date.now()}.pdf`);
}

/**
 * Préparer les données pour le graphique radar
 */
export function prepareRadarData(audit: Audit, results: AuditResults): RadarData[] {
  return audit.categories.map((category) => ({
    category: category.name,
    score: results.categoryScores[category.id] || 0,
  }));
}

