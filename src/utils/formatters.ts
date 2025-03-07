export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sl-SI', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    }).format(amount);
};

export const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('sl-SI', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value / 100);
};

export const formatNumber = (value: number) => {
    return new Intl.NumberFormat('sl-SI', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

export const formatDistance = (distanceInKm: number) => {
    if (distanceInKm < 1) {
        return `${Math.round(distanceInKm * 1000)} m`;
    }
    return `${distanceInKm.toFixed(1)} km`;
};

export const formatDuration = (durationInSeconds: number, detailed: boolean = false) => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    
    if (hours === 0 && minutes === 0) {
        return `${seconds} sek`;
    } else if (hours === 0) {
        return `${minutes} min ${detailed ? seconds + ' sek' : ''}`;
    }
    
    return `${hours}h ${minutes}min${detailed ? ' ' + seconds + 'sek' : ''}`;
};
