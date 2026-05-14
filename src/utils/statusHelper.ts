export type RevisionStatus = 'ATRASADA' | 'PROXIMA' | 'EM_DIA' | 'INDEFINIDA';

export const getRevisionStatus = (dateStr?: string, targetMileage?: number, currentMileage?: number): RevisionStatus => {
  if (!dateStr && !targetMileage) return 'INDEFINIDA';
  
  let statusByDate: RevisionStatus = 'INDEFINIDA';
  if (dateStr) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const revDate = new Date(dateStr);
    revDate.setHours(0,0,0,0);
    
    const diffTime = revDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) statusByDate = 'ATRASADA';
    else if (diffDays <= 30) statusByDate = 'PROXIMA';
    else statusByDate = 'EM_DIA';
  }
  
  let statusByMileage: RevisionStatus = 'INDEFINIDA';
  if (targetMileage && currentMileage !== undefined) {
    const diff = targetMileage - currentMileage;
    if (diff < 0) statusByMileage = 'ATRASADA';
    else if (diff <= 1000) statusByMileage = 'PROXIMA';
    else statusByMileage = 'EM_DIA';
  }

  if (statusByDate === 'ATRASADA' || statusByMileage === 'ATRASADA') return 'ATRASADA';
  if (statusByDate === 'PROXIMA' || statusByMileage === 'PROXIMA') return 'PROXIMA';
  if (statusByDate === 'EM_DIA' || statusByMileage === 'EM_DIA') return 'EM_DIA';
  
  return 'INDEFINIDA';
};

export const getStatusColor = (status: RevisionStatus) => {
  switch(status) {
    case 'ATRASADA': return '#EF4444'; // Red
    case 'PROXIMA': return '#F59E0B';  // Orange
    case 'EM_DIA': return '#10B981';   // Green
    default: return '#6B7280';         // Gray
  }
};

export const getStatusLabel = (status: RevisionStatus) => {
  switch(status) {
    case 'ATRASADA': return 'Atrasada';
    case 'PROXIMA': return 'Próxima';
    case 'EM_DIA': return 'Em dia';
    default: return 'Indefinida';
  }
};
