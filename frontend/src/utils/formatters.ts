export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'green';
    case 'generating': return 'blue';
    case 'failed': return 'red';
    default: return 'gray';
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};
