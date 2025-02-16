export interface ClientBasicInfo {
    name: string;
    email: string;
    phone: string;
    taxNumber?: string;
    address: {
        street: string;
        city: string;
        postalCode: string;
    };
}

export interface Client {
    id: string;
    type: 'COMPANY' | 'INDIVIDUAL';
    basicInfo: ClientBasicInfo;
    vatRate: number;
    discountLevel: number;
    discountValue: number;
    source: string;
    projects: string[];
}