import jsPDF from 'jspdf';
import type { Audit, AuditResults, RadarData, CorrectiveActionData, AuditItem } from '../types';
import { convertNonConformitiesToNote } from './calculations';

/**
 * Mapping des catégories vers les 6 catégories du radar
 */
const RADAR_CATEGORIES = [
  'LOCAUX ET EQUIPEMENTS',
  'MAITRISE DES TEMPERATURES',
  'MAITRISE DES MATIERES',
  'TRACABILITE ET GESTION DES NON-CONFORMITES',
  'GESTION DES DECHETS ET DES SOUS-PRODUITS ANIMAUX',
  'GESTION DU PERSONNEL'
];

/**
 * Normaliser le nom de catégorie pour le mapping
 */
function normalizeCategoryName(name: string): string {
  // Retirer le numéro et les espaces en début/fin, remplacer les accents
  const normalized = name
    .replace(/^\d+\.\s*/, '')
    .trim()
    .toUpperCase()
    .replace(/É/g, 'E')
    .replace(/È/g, 'E')
    .replace(/Ê/g, 'E')
    .replace(/À/g, 'A')
    .replace(/\s+/g, ' '); // Normaliser les espaces multiples
  return normalized;
}

/**
 * Mapping direct des noms de catégories normalisés vers les indices du radar
 */
function getRadarIndexForCategory(normalizedName: string): number {
  // Mapping exact après normalisation
  if (normalizedName.includes('LOCAUX ET EQUIPEMENTS')) return 0;
  if (normalizedName.includes('MAITRISE DES TEMPERATURES')) return 1;
  if (normalizedName.includes('MAITRISE DES MATIERES')) return 2;
  if (normalizedName.includes('TRACABILITE ET GESTION DES NON-CONFORMITES')) return 3;
  if (normalizedName.includes('GESTION DES DECHETS ET DES SOUS-PRODUITS ANIMAUX')) return 4;
  if (normalizedName.includes('GESTION DU PERSONNEL')) return 5;
  return -1;
}

/**
 * Mapper les catégories de l'audit vers les catégories du radar
 */
function mapCategoriesToRadar(audit: Audit, results: AuditResults): RadarData[] {
  const radarData: RadarData[] = new Array(6).fill(null).map((_, index) => ({
    category: RADAR_CATEGORIES[index],
    score: 0,
  }));
  
  console.log('[Radar] Tous les scores disponibles:', results.categoryScores);
  console.log('[Radar] Nombre de catégories dans l\'audit:', audit.categories.length);
  
  // Parcourir toutes les catégories de l'audit
  audit.categories.forEach((auditCategory) => {
    const normalized = normalizeCategoryName(auditCategory.name);
    const categoryScore = results.categoryScores[auditCategory.id];
    
    console.log(`[Radar] Catégorie: "${auditCategory.name}" -> Normalisé: "${normalized}"`);
    console.log(`[Radar] ID catégorie: ${auditCategory.id}`);
    console.log(`[Radar] Score dans results.categoryScores:`, categoryScore);
    
    // Trouver l'index correspondant dans le radar
    const radarIndex = getRadarIndexForCategory(normalized);
    
    if (radarIndex >= 0) {
      console.log(`[Radar] Mapping trouvé: index ${radarIndex} pour "${RADAR_CATEGORIES[radarIndex]}"`);
      
      // Si le score existe et n'est pas null, l'assigner
      if (categoryScore !== null && categoryScore !== undefined && typeof categoryScore === 'number') {
        radarData[radarIndex].score = categoryScore;
        console.log(`[Radar] ✓ Score assigné: ${categoryScore}% à "${RADAR_CATEGORIES[radarIndex]}"`);
      } else {
        console.log(`[Radar] ✗ Score null/undefined/invalide (${categoryScore}), garde 0`);
      }
    } else {
      console.log(`[Radar] ✗ Pas de mapping trouvé pour "${normalized}"`);
    }
  });
  
  console.log('[Radar] Données finales pour le graphique:');
  radarData.forEach((d, idx) => {
    console.log(`  ${idx + 1}. ${d.category}: ${d.score}%`);
  });
  
  return radarData;
}

/**
 * Formater un nombre avec virgule pour décimales et espace pour milliers (format français)
 */
function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Dessiner une pastille de couleur selon la note
 * @param pdf Instance jsPDF
 * @param x Position X
 * @param y Position Y
 * @param score Note en pourcentage (0-100)
 */
function drawScoreBadge(pdf: jsPDF, x: number, y: number, score: number): void {
  const radius = 4; // Rayon de la pastille
  
  if (score < 80) {
    // Rouge avec croix
    pdf.setFillColor(220, 53, 69); // Rouge
    pdf.circle(x, y, radius, 'F');
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    // Dessiner une croix
    pdf.line(x - 2, y - 2, x + 2, y + 2);
    pdf.line(x + 2, y - 2, x - 2, y + 2);
  } else if (score >= 80 && score < 90) {
    // Orange avec point d'exclamation
    pdf.setFillColor(255, 152, 0); // Orange
    pdf.circle(x, y, radius, 'F');
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    // Dessiner un point d'exclamation
    pdf.setFontSize(6);
    pdf.setTextColor(255, 255, 255);
    pdf.text('!', x, y + 1.5, { align: 'center' });
  } else {
    // Vert avec encoche "validé"
    pdf.setFillColor(76, 175, 80); // Vert
    pdf.circle(x, y, radius, 'F');
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    // Dessiner une encoche (checkmark)
    pdf.line(x - 1.5, y, x - 0.5, y + 1.5);
    pdf.line(x - 0.5, y + 1.5, x + 2, y - 1);
  }
}

/**
 * Calculer la contribution en % d'un item au score de sa catégorie
 * Contribution = (note × pondération / somme des pondérations) × 100
 */
function calculateItemContribution(item: AuditItem, categoryItems: AuditItem[]): number {
  if (item.note === undefined || item.note === null) return 0;
  
  // Calculer la somme des pondérations de tous les items audités de la catégorie
  const totalPonderation = categoryItems
    .filter(i => i.isAudited && i.numberOfNonConformities !== null)
    .reduce((sum, i) => sum + i.ponderation, 0);
  
  if (totalPonderation === 0) return 0;
  
  return Math.round((item.note * item.ponderation / totalPonderation) * 100);
}

/**
 * Formater la note brute pour affichage (1, 0,7, 0,3, 0)
 */
function formatRawNote(note: number | null | undefined): string {
  if (note === null || note === undefined) return '';
  if (note === 1.0) return '1';
  if (note === 0.7) return '0,7';
  if (note === 0.3) return '0,3';
  if (note === 0.0) return '0';
  return note.toString().replace('.', ',');
}

/**
 * Générer la page avec le graphique radar
 */
function generateRadarChartPage(pdf: jsPDF, audit: Audit, results: AuditResults): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // En-tête avec logo, titre et contact
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 118, 210);
  pdf.text('ALEXANN', margin, yPosition);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Hygiène et qualité agroalimentaire', margin, yPosition + 5);

  // Titre au centre
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('CARTOGRAPHIE RADAR LES BONNES PRATIQUES D\'HYGIENE', pageWidth / 2, yPosition + 3, { align: 'center' });

  // Contact à droite
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const contactLines = [
    'Anne SUQUET',
    'anne@alexann.fr',
    '06 46 45 67 33'
  ];
  contactLines.forEach((line, idx) => {
    pdf.text(line, pageWidth - margin, yPosition + (idx * 4), { align: 'right' });
  });

  yPosition += 20;

  // Sous-titre
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CARTOGRAPHIE RADAR DES "BONNES PRATIQUES HYGIENIQUES"', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  // Informations de l'audit
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Adresse : ${audit.adresse}`, margin, yPosition);
  yPosition += 5;
  pdf.text(`Date de l'exécution : ${new Date(audit.dateExecution).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, margin, yPosition);
  yPosition += 15;

  // Préparer les données du radar
  const radarData = mapCategoriesToRadar(audit, results);

  // Dimensions du graphique radar
  const chartCenterX = pageWidth / 2;
  const chartCenterY = yPosition + 50; // Centre du graphique (ajusté pour être plus visible)
  const chartRadius = 40; // Rayon maximum (100%)
  const numCategories = 6;
  const angleStep = (2 * Math.PI) / numCategories;

  // Dessiner les cercles concentriques (hexagones)
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.5);
  for (let level = 1; level <= 4; level++) {
    const radius = (chartRadius * level) / 4;
    const points: number[][] = [];
    for (let i = 0; i < numCategories; i++) {
      const angle = (i * angleStep) - (Math.PI / 2); // Commencer en haut
      const x = chartCenterX + radius * Math.cos(angle);
      const y = chartCenterY + radius * Math.sin(angle);
      points.push([x, y]);
    }
    // Fermer l'hexagone
    points.push(points[0]);
    
    // Dessiner l'hexagone
    for (let i = 0; i < points.length - 1; i++) {
      pdf.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }
    
    // Labels des pourcentages sur chaque axe (pas seulement en haut)
    pdf.setFontSize(6);
    pdf.setTextColor(120, 120, 120);
    for (let i = 0; i < numCategories; i++) {
      const angle = (i * angleStep) - (Math.PI / 2);
      const labelRadius = radius + 2;
      const labelX = chartCenterX + labelRadius * Math.cos(angle);
      const labelY = chartCenterY + labelRadius * Math.sin(angle);
      if (level === 4) { // Afficher le label seulement sur le cercle extérieur
        pdf.text(`${level * 25}%`, labelX, labelY, { align: 'center' });
      }
    }
  }

  // Label 0% au centre
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text('0%', chartCenterX, chartCenterY, { align: 'center' });

  // Dessiner les axes
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.3);
  for (let i = 0; i < numCategories; i++) {
    const angle = (i * angleStep) - (Math.PI / 2);
    const x = chartCenterX + chartRadius * Math.cos(angle);
    const y = chartCenterY + chartRadius * Math.sin(angle);
    pdf.line(chartCenterX, chartCenterY, x, y);
  }

  // Dessiner le polygone des données
  const dataPoints: number[][] = [];
  radarData.forEach((data, index) => {
    const angle = (index * angleStep) - (Math.PI / 2);
    const radius = (chartRadius * data.score) / 100;
    const x = chartCenterX + radius * Math.cos(angle);
    const y = chartCenterY + radius * Math.sin(angle);
    dataPoints.push([x, y]);
  });
  
  // Dessiner le polygone rempli (ligne épaisse bleue)
  if (dataPoints.length > 2) {
    // Dessiner les lignes du polygone avec une ligne plus épaisse
    pdf.setDrawColor(25, 118, 210);
    pdf.setLineWidth(2.5); // Ligne plus épaisse pour être visible
    for (let i = 0; i < dataPoints.length; i++) {
      const nextIndex = (i + 1) % dataPoints.length;
      pdf.line(dataPoints[i][0], dataPoints[i][1], dataPoints[nextIndex][0], dataPoints[nextIndex][1]);
    }
    
    // Dessiner les points de données (cercles plus grands)
    pdf.setFillColor(25, 118, 210);
    pdf.setDrawColor(25, 118, 210);
    dataPoints.forEach((point) => {
      pdf.circle(point[0], point[1], 2, 'FD'); // Rempli avec bordure
    });
  }

  // Labels des catégories autour du graphique
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  radarData.forEach((data, index) => {
    const angle = (index * angleStep) - (Math.PI / 2);
    const labelRadius = chartRadius + 15; // Plus d'espace pour les labels
    const labelX = chartCenterX + labelRadius * Math.cos(angle);
    const labelY = chartCenterY + labelRadius * Math.sin(angle);
    
    // Ajuster l'alignement selon la position
    let align: 'left' | 'center' | 'right' = 'center';
    if (Math.abs(Math.cos(angle)) > 0.5) {
      align = Math.cos(angle) > 0 ? 'left' : 'right';
    }
    
    const lines = pdf.splitTextToSize(data.category, 28);
    lines.forEach((line: string, lineIdx: number) => {
      pdf.text(line, labelX, labelY + (lineIdx * 3.5), { align });
    });
  });

  // Résumé en bas de page
  yPosition = pageHeight - 40;
  
  // Nombre de KO et amendes (gauche)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(211, 47, 47);
  pdf.text(`Nombre de KO = ${results.numberOfKO}`, margin, yPosition);
  pdf.text(`Amendes potentielles = ${formatNumber(results.potentialFines)} €`, margin, yPosition + 6);

  // Score total (droite)
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  const totalScoreText = results.totalScore !== null ? `${formatNumber(results.totalScore, 2)} %` : '— %';
  pdf.text('Maîtrise de l\'hygiène à :', pageWidth - margin - 50, yPosition, { align: 'right' });
  
  // Pastille de couleur selon la note
  if (results.totalScore !== null) {
    drawScoreBadge(pdf, pageWidth - margin - 30, yPosition + 3, results.totalScore);
  }
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(totalScoreText, pageWidth - margin, yPosition, { align: 'right' });
}

/**
 * Générer la page "ACTIONS CORRECTIVES ATTENDUES" au début du PDF
 */
function generateCorrectiveActionsPage(pdf: jsPDF, audit: Audit): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // En-tête avec logo, titre et contact
  // Logo Alexann (simulé par du texte pour l'instant)
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 118, 210);
  pdf.text('ALEXANN', margin, yPosition);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Hygiène et qualité agroalimentaire', margin, yPosition + 5);

  // Titre au centre
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('CARTOGRAPHIE RADAR LES BONNES PRATIQUES D\'HYGIENE', pageWidth / 2, yPosition + 3, { align: 'center' });

  // Contact à droite
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const contactLines = [
    'Anne SUQUET',
    'anne@alexann.fr',
    '06 46 45 67 33'
  ];
  contactLines.forEach((line, idx) => {
    pdf.text(line, pageWidth - margin, yPosition + (idx * 4), { align: 'right' });
  });

  yPosition += 20;

  // Titre du tableau
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ACTIONS CORRECTIVES ATTENDUES', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // Récupérer UNIQUEMENT les données saisies par l'auditeur dans le tableau
  // Ne pas pré-remplir avec les observations - seul l'auditeur remplit le tableau
  let correctiveActionsData: CorrectiveActionData[] = [];
  
  if (audit.correctiveActions && audit.correctiveActions.length > 0) {
    // Utiliser uniquement les données sauvegardées depuis le tableau "Actions Correctives"
    correctiveActionsData = audit.correctiveActions.filter(ca => ca.ecart && ca.ecart.trim());
  }
  // Si aucune donnée n'existe, le tableau reste vide (pas de pré-remplissage)

  // Largeurs des colonnes
  const availableWidth = pageWidth - 2 * margin;
  const colWidths = {
    ecart: availableWidth * 0.30,           // 30%
    actionCorrective: availableWidth * 0.25, // 25%
    delai: availableWidth * 0.10,            // 10%
    quand: availableWidth * 0.10,            // 10%
    visa: availableWidth * 0.10,             // 10%
    verification: availableWidth * 0.15,      // 15%
  };

  const headerHeight = 10;
  const subHeaderHeight = 6;

  // En-tête du tableau - Première ligne
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  
  let currentX = margin;
  
  // Colonne "Ecarts constatés" (rowspan 2)
  pdf.rect(currentX, yPosition, colWidths.ecart, headerHeight + subHeaderHeight);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  const ecartLines = pdf.splitTextToSize('Ecarts constatés', colWidths.ecart - 4);
  ecartLines.forEach((line: string, idx: number) => {
    pdf.text(line, currentX + colWidths.ecart / 2, yPosition + headerHeight / 2 + (idx * 4) - 1, { align: 'center' });
  });
  currentX += colWidths.ecart;

  // Colonne "Actions correctives définies par le responsable" (rowspan 2)
  pdf.rect(currentX, yPosition, colWidths.actionCorrective, headerHeight + subHeaderHeight);
  const actionLines = pdf.splitTextToSize('Actions correctives définies par le responsable', colWidths.actionCorrective - 4);
  actionLines.forEach((line: string, idx: number) => {
    pdf.text(line, currentX + colWidths.actionCorrective / 2, yPosition + headerHeight / 2 + (idx * 4) - 1, { align: 'center' });
  });
  currentX += colWidths.actionCorrective;

  // Colonne "Délai" (rowspan 2)
  pdf.rect(currentX, yPosition, colWidths.delai, headerHeight + subHeaderHeight);
  pdf.text('Délai', currentX + colWidths.delai / 2, yPosition + headerHeight / 2 + 2, { align: 'center' });
  currentX += colWidths.delai;

  // Colonne "Réalisation" (colspan 2)
  pdf.rect(currentX, yPosition, colWidths.quand + colWidths.visa, headerHeight);
  pdf.text('Réalisation', currentX + (colWidths.quand + colWidths.visa) / 2, yPosition + headerHeight / 2 + 2, { align: 'center' });
  
  // Sous-colonnes "Quand" et "Visa"
  pdf.rect(currentX, yPosition + headerHeight, colWidths.quand, subHeaderHeight);
  pdf.setFontSize(8);
  pdf.text('Quand', currentX + colWidths.quand / 2, yPosition + headerHeight + subHeaderHeight / 2 + 1, { align: 'center' });
  currentX += colWidths.quand;
  
  pdf.rect(currentX, yPosition + headerHeight, colWidths.visa, subHeaderHeight);
  pdf.text('Visa', currentX + colWidths.visa / 2, yPosition + headerHeight + subHeaderHeight / 2 + 1, { align: 'center' });
  currentX += colWidths.visa;

  // Colonne "Vérification" (rowspan 2)
  pdf.rect(currentX, yPosition, colWidths.verification, headerHeight + subHeaderHeight);
  pdf.setFontSize(9);
  pdf.text('Vérification', currentX + colWidths.verification / 2, yPosition + headerHeight / 2 + 2, { align: 'center' });

  yPosition += headerHeight + subHeaderHeight;

  // Lignes de données - Afficher les données saisies + lignes vides pour remplissage manuel
  const minEmptyRows = 8; // Nombre minimum de lignes vides à afficher
  const rowHeight = 10;
  const maxRowsPerPage = Math.floor((pageHeight - yPosition - 20) / rowHeight);
  
  // Calculer le nombre total de lignes à afficher (données + lignes vides)
  const totalRowsToShow = Math.max(correctiveActionsData.length, minEmptyRows);
  
  let dataIndex = 0;
  let currentPage = 1;

  while (dataIndex < totalRowsToShow) {
    // Ajouter une nouvelle page si nécessaire (sauf pour la première)
    if (currentPage > 1) {
      pdf.addPage();
      yPosition = margin + 20;
    }

    const rowsToShow = Math.min(maxRowsPerPage, totalRowsToShow - dataIndex);
    
    for (let i = 0; i < rowsToShow; i++) {
      const rowIndex = dataIndex + i;
      const rowData = rowIndex < correctiveActionsData.length ? correctiveActionsData[rowIndex] : null;

      currentX = margin;
      const cellY = yPosition + (i * rowHeight);

      // Colonne Ecarts constatés
      pdf.rect(currentX, cellY, colWidths.ecart, rowHeight);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      if (rowData && rowData.ecart && rowData.ecart.trim()) {
        const ecartLines = pdf.splitTextToSize(rowData.ecart.trim(), colWidths.ecart - 4);
        ecartLines.forEach((line: string, idx: number) => {
          pdf.text(line, currentX + 2, cellY + 3 + (idx * 3));
        });
      }
      // Si pas de données, laisser vide (pas de texte)
      currentX += colWidths.ecart;

      // Colonne Actions correctives
      pdf.rect(currentX, cellY, colWidths.actionCorrective, rowHeight);
      if (rowData && rowData.actionCorrective && rowData.actionCorrective.trim()) {
        const actionLines = pdf.splitTextToSize(rowData.actionCorrective.trim(), colWidths.actionCorrective - 4);
        actionLines.forEach((line: string, idx: number) => {
          pdf.text(line, currentX + 2, cellY + 3 + (idx * 3));
        });
      }
      // Si pas de données, laisser vide
      currentX += colWidths.actionCorrective;

      // Colonne Délai
      pdf.rect(currentX, cellY, colWidths.delai, rowHeight);
      if (rowData && rowData.delai && rowData.delai.trim()) {
        pdf.text(rowData.delai.trim(), currentX + 2, cellY + 6);
      }
      // Si pas de données, laisser vide
      currentX += colWidths.delai;

      // Colonne Quand
      pdf.rect(currentX, cellY, colWidths.quand, rowHeight);
      if (rowData && rowData.quand && rowData.quand.trim()) {
        pdf.text(rowData.quand.trim(), currentX + 2, cellY + 6);
      }
      // Si pas de données, laisser vide
      currentX += colWidths.quand;

      // Colonne Visa
      pdf.rect(currentX, cellY, colWidths.visa, rowHeight);
      if (rowData && rowData.visa && rowData.visa.trim()) {
        pdf.text(rowData.visa.trim(), currentX + 2, cellY + 6);
      }
      // Si pas de données, laisser vide
      currentX += colWidths.visa;

      // Colonne Vérification
      pdf.rect(currentX, cellY, colWidths.verification, rowHeight);
      if (rowData && rowData.verification && rowData.verification.trim()) {
        pdf.text(rowData.verification.trim(), currentX + 2, cellY + 6);
      }
      // Si pas de données, laisser vide
    }

    dataIndex += rowsToShow;
    currentPage++;
  }
}

/**
 * Générer un rapport PDF à partir d'un audit avec un tableau structuré
 */
export async function generatePDFReport(audit: Audit, results: AuditResults): Promise<void> {
  console.log('Génération PDF - Audit:', audit);
  console.log('Génération PDF - Catégories:', audit.categories);
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Générer d'abord la page avec le graphique radar
  generateRadarChartPage(pdf, audit, results);
  
  // Ajouter la page "ACTIONS CORRECTIVES ATTENDUES"
  pdf.addPage();
  generateCorrectiveActionsPage(pdf, audit);
  
  // Ajouter une nouvelle page pour le reste du rapport
  pdf.addPage();
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Fonction pour ajouter une nouvelle page si nécessaire
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin - 20) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // En-tête du document (format Alexann)
  // Logo à gauche
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(25, 118, 210);
  pdf.text('ALEXANN', margin, yPosition);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Hygiène et qualité agroalimentaire', margin, yPosition + 5);
  
  // Titre au centre
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('AUDIT LES BONNES PRATIQUES D\'HYGIENE', pageWidth / 2, yPosition + 3, { align: 'center' });
  
  // Contact à droite
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const contactLines = [
    'Anne SUQUET',
    'anne@alexann.fr',
    '06 46 45 67 33'
  ];
  contactLines.forEach((line, idx) => {
    pdf.text(line, pageWidth - margin, yPosition + (idx * 4), { align: 'right' });
  });
  
  yPosition += 15;
  
  // Date et adresse
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date de l'exécution : ${new Date(audit.dateExecution).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, margin, yPosition);
  pdf.text(`Adresse : ${audit.adresse}`, margin + 80, yPosition);
  
  yPosition += 8;

  // Tableau principal par catégorie
  for (let catIndex = 0; catIndex < audit.categories.length; catIndex++) {
    const category = audit.categories[catIndex];
    // Vérifier si la catégorie a des items audités
    const auditedItems = category.items.filter(item => item.isAudited);
    if (auditedItems.length === 0) continue;

    // Calculer le score de la catégorie
    const categoryScore = results.categoryScores[category.id];
    const categoryScoreText = categoryScore !== null && categoryScore !== undefined 
      ? `${formatNumber(categoryScore, 0)}%` 
      : '';

    // En-tête du tableau avec colonnes : NO | * | Note | Commentaires | Actions correctives | Photo(s)
    const availableWidth = pageWidth - 2 * margin;
    const colWidths = {
      no: 8,          // NO (numéro)
      star: 8,        // * (note brute)
      note: 12,       // Note (contribution %)
      comments: (availableWidth - 8 - 8 - 12 - 30) * 0.45,  // Commentaires
      actions: (availableWidth - 8 - 8 - 12 - 30) * 0.45,  // Actions
      photos: 30      // Photos
    };

    // Titre de la catégorie avec score
    checkPageBreak(30);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 118, 210);
    const categoryTitle = category.name.replace(/^\d+\.\s*/, '');
    
    // Afficher le titre de catégorie et le score si disponible
    if (categoryScoreText) {
      pdf.text(`${catIndex + 1}. ${categoryTitle.toUpperCase()}`, margin, yPosition);
      // Afficher le score à droite de l'en-tête
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(categoryScoreText, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 5;
      
      // En-tête du tableau
      let currentX = margin;
      pdf.setFillColor(240, 240, 240);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      
      pdf.rect(currentX, yPosition, colWidths.no, 8);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('NO', currentX + colWidths.no / 2, yPosition + 5, { align: 'center' });
      currentX += colWidths.no;

      pdf.rect(currentX, yPosition, colWidths.star, 8);
      pdf.text('*', currentX + colWidths.star / 2, yPosition + 5, { align: 'center' });
      currentX += colWidths.star;

      pdf.rect(currentX, yPosition, colWidths.note, 8);
      pdf.text('Note', currentX + colWidths.note / 2, yPosition + 5, { align: 'center' });
      currentX += colWidths.note;

      pdf.rect(currentX, yPosition, colWidths.comments, 8);
      pdf.setFontSize(6);
      pdf.text('Commentaires', currentX + colWidths.comments / 2, yPosition + 5, { align: 'center' });
      currentX += colWidths.comments;

      pdf.rect(currentX, yPosition, colWidths.actions, 8);
      pdf.text('Actions correctives', currentX + colWidths.actions / 2, yPosition + 5, { align: 'center' });
      currentX += colWidths.actions;

      pdf.rect(currentX, yPosition, colWidths.photos, 8);
      pdf.text('Photo(s)', currentX + colWidths.photos / 2, yPosition + 5, { align: 'center' });

      yPosition += 8;

      // Lignes du tableau pour chaque item audité
      let itemNumber = 1;
      for (const item of auditedItems) {
        // Calculer la note brute et la contribution
        const rawNote = item.numberOfNonConformities !== null 
          ? convertNonConformitiesToNote(item.classification, item.numberOfNonConformities)
          : null;
        const contribution = rawNote !== null && rawNote !== undefined
          ? calculateItemContribution({ ...item, note: rawNote }, category.items)
          : 0;
        
        // Calculer la hauteur nécessaire pour cette ligne
        let commentsLines = 1;
        let actionsLines = 1;
        
        if (item.observations && item.observations.length > 0) {
          commentsLines = item.observations.reduce((total, obs) => {
            if (obs && obs.text && obs.text.trim()) {
              return total + pdf.splitTextToSize(obs.text.trim(), colWidths.comments - 4).length;
            }
            return total;
          }, 0);
          
          actionsLines = item.observations
            .filter(obs => obs && obs.correctiveAction && obs.correctiveAction.trim())
            .reduce((total, obs) => {
              return total + pdf.splitTextToSize(obs.correctiveAction || '', colWidths.actions - 4).length;
            }, 0) || 1;
        }
        
        // Calculer la hauteur pour les photos
        const photosRows = item.photos.length > 0 ? Math.ceil(Math.min(item.photos.length, 3) / 3) : 0;
        const photoHeight = photosRows > 0 ? photosRows * 22 + 4 : 0;
        
        const rowHeight = Math.max(
          10, // Hauteur minimale
          Math.max(commentsLines, actionsLines) * 3.5 + 4,
          photoHeight
        );

        checkPageBreak(rowHeight + 5);

        let currentX = margin;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      
      // Colonne NO
      pdf.rect(currentX, yPosition, colWidths.no, rowHeight);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(itemNumber.toString(), currentX + colWidths.no / 2, yPosition + rowHeight / 2 + 2, { align: 'center' });
      currentX += colWidths.no;

      // Colonne * (note brute)
      pdf.rect(currentX, yPosition, colWidths.star, rowHeight);
      if (rawNote !== null && rawNote !== undefined) {
        pdf.text(formatRawNote(rawNote), currentX + colWidths.star / 2, yPosition + rowHeight / 2 + 2, { align: 'center' });
      }
      currentX += colWidths.star;

      // Colonne Note (contribution %)
      pdf.rect(currentX, yPosition, colWidths.note, rowHeight);
      if (contribution > 0) {
        pdf.text(`${contribution}%`, currentX + colWidths.note / 2, yPosition + rowHeight / 2 + 2, { align: 'center' });
      }
      currentX += colWidths.note;

      // Colonne Commentaires
      pdf.rect(currentX, yPosition, colWidths.comments, rowHeight);
      pdf.setFontSize(7);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      if (item.observations && item.observations.length > 0) {
        let commentY = yPosition + 3.5;
        let hasComments = false;
        item.observations.forEach((obs) => {
          if (obs && obs.text && obs.text.trim()) {
            hasComments = true;
            const lines = pdf.splitTextToSize(obs.text.trim(), colWidths.comments - 4);
            lines.forEach((line: string, lineIdx: number) => {
              pdf.text(line, currentX + 2, commentY + (lineIdx * 3.5));
            });
            commentY += lines.length * 3.5 + 0.5;
          }
        });
        if (!hasComments) {
          pdf.setTextColor(128, 128, 128);
          pdf.text('-', currentX + colWidths.comments / 2, yPosition + rowHeight / 2 + 2, { align: 'center' });
        }
      } else {
        pdf.setTextColor(128, 128, 128);
        pdf.text('-', currentX + colWidths.comments / 2, yPosition + rowHeight / 2 + 2, { align: 'center' });
      }
      currentX += colWidths.comments;

      // Colonne Actions correctives
      pdf.rect(currentX, yPosition, colWidths.actions, rowHeight);
      pdf.setFontSize(7);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      if (item.observations && item.observations.length > 0) {
        let actionY = yPosition + 3.5;
        let hasActions = false;
        // Afficher les actions dans le même ordre que les commentaires
        item.observations.forEach((obs) => {
          if (obs && obs.correctiveAction && obs.correctiveAction.trim()) {
            hasActions = true;
            const lines = pdf.splitTextToSize(obs.correctiveAction.trim(), colWidths.actions - 4);
            lines.forEach((line: string, lineIdx: number) => {
              pdf.text(line, currentX + 2, actionY + (lineIdx * 3.5));
            });
            actionY += lines.length * 3.5 + 0.5;
          } else {
            // Si pas d'action pour ce commentaire, laisser un espace
            actionY += 3.5;
          }
        });
        if (!hasActions) {
          pdf.setTextColor(128, 128, 128);
          pdf.text('-', currentX + colWidths.actions / 2, yPosition + rowHeight / 2 + 2, { align: 'center' });
        }
      } else {
        pdf.setTextColor(128, 128, 128);
        pdf.text('-', currentX + colWidths.actions / 2, yPosition + rowHeight / 2 + 2, { align: 'center' });
      }
      currentX += colWidths.actions;

      // Colonne Photos
      pdf.rect(currentX, yPosition, colWidths.photos, rowHeight);
      if (item.photos.length > 0) {
        // Charger et ajouter les photos
        let photoX = currentX + 1;
        let photoY = yPosition + 1;
        const maxPhotosPerRow = 3;
        const photoSize = Math.min(20, (colWidths.photos - 4) / maxPhotosPerRow);
        
        for (let i = 0; i < Math.min(maxPhotosPerRow, item.photos.length); i++) {
          try {
            const photoData = item.photos[i];
            
            // Extraire le base64 pur si c'est un data URL
            let base64Data = photoData;
            if (photoData.startsWith('data:image/')) {
              // Extraire la partie base64 après la virgule
              const base64Index = photoData.indexOf(',');
              if (base64Index !== -1) {
                base64Data = photoData.substring(base64Index + 1);
              }
            }
            
            const img = new Image();
            
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Timeout loading image'));
              }, 5000);
              
              const processImage = () => {
                clearTimeout(timeout);
                try {
                  // Redimensionner l'image pour qu'elle rentre dans la cellule
                  let finalWidth = photoSize;
                  let finalHeight = photoSize;
                  
                  if (img.width > 0 && img.height > 0) {
                    if (img.width > img.height) {
                      finalHeight = (photoSize * img.height) / img.width;
                    } else {
                      finalWidth = (photoSize * img.width) / img.height;
                    }
                  }
                  
                  // Utiliser le base64 pur pour jsPDF
                  pdf.addImage(base64Data, 'JPEG', photoX, photoY, finalWidth, finalHeight);
                  
                  photoX += photoSize + 1;
                  if ((i + 1) % maxPhotosPerRow === 0) {
                    photoX = currentX + 1;
                    photoY += photoSize + 1;
                  }
                  resolve();
                } catch (error) {
                  console.error('Erreur lors de l\'ajout de l\'image au PDF:', error);
                  pdf.setFontSize(6);
                  pdf.text('📷', photoX, photoY + 3);
                  photoX += photoSize + 1;
                  resolve();
                }
              };
              
              img.onload = processImage;
              img.onerror = () => {
                clearTimeout(timeout);
                console.error('Erreur lors du chargement de l\'image');
                pdf.setFontSize(6);
                pdf.text('📷', photoX, photoY + 3);
                photoX += photoSize + 1;
                resolve();
              };
              
              // Utiliser le data URL complet pour charger l'image
              img.src = photoData;
              
              // Si l'image est déjà chargée (depuis le cache), onload ne se déclenchera pas
              if (img.complete && img.naturalWidth > 0) {
                processImage();
              }
            });
          } catch (error) {
            console.error('Erreur lors du traitement de la photo:', error);
            pdf.setFontSize(6);
            pdf.text('📷', photoX, photoY + 3);
            photoX += photoSize + 1;
          }
        }
        
        if (item.photos.length > maxPhotosPerRow) {
          pdf.setFontSize(6);
          pdf.text(`+${item.photos.length - maxPhotosPerRow}`, photoX, photoY);
        }
      } else {
        pdf.setTextColor(128, 128, 128);
        pdf.text('-', currentX + colWidths.photos / 2, yPosition + rowHeight / 2 + 2, { align: 'center' });
      }

        yPosition += rowHeight;
        itemNumber++;
      }
    } else {
      // Si pas de score, juste le titre
      pdf.text(`${catIndex + 1}. ${categoryTitle.toUpperCase()}`, margin, yPosition);
      yPosition += 8;
    }

    // Ligne de séparation après la catégorie
    yPosition += 3;
  }

  // Pied de page avec note totale et légende (sur la dernière page seulement)
  let totalPages = pdf.getNumberOfPages();
  pdf.setPage(totalPages);
  
  // Vérifier s'il y a assez d'espace pour le pied de page
  // Si pas assez d'espace, ajouter une nouvelle page
  if (yPosition + 20 > pageHeight - 20) {
    pdf.addPage();
    yPosition = margin;
    totalPages = pdf.getNumberOfPages(); // Mettre à jour le nombre total de pages
  } else {
    yPosition += 5;
  }
  
  // Note totale et nombre de KO
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  const totalScoreText = results.totalScore !== null 
    ? formatNumber(results.totalScore, 2)
    : '—';
  
  // Afficher la note totale avec la pastille de couleur
  const noteText = `NOTE TOTALE obtenue pour l'ensemble des Bonnes Pratiques d'Hygiène : ${totalScoreText}%`;
  pdf.text(noteText, margin, yPosition);
  
  // Ajouter la pastille de couleur à côté de la note
  if (results.totalScore !== null) {
    const badgeX = margin + pdf.getTextWidth(noteText) + 3;
    drawScoreBadge(pdf, badgeX, yPosition - 1, results.totalScore);
  }
  
  pdf.text(`nombre de KO : ${results.numberOfKO}`, margin + 100, yPosition);
  
  yPosition += 8;
  
  // Légende - toujours affichée
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  const legendText = '* 1 : conforme ; 0,7 : non-conformité mineur ; 0,3 : non-conformité moyenne ; 0 : non-conformité majeur';
  pdf.text(legendText, margin, yPosition);

  // Numéro de page sur toutes les pages (recalculer après ajout éventuel de page)
  totalPages = pdf.getNumberOfPages();
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
