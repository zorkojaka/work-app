// 1. Tipi
export type StageId = string;
export type StageTitle = string;

export interface ProjectStage {
    id: StageId;
    title: StageTitle;
    order: number;
}

export interface ProjectStageGroup {
    status: string;
    title: string;
    stages: ProjectStage[];
}

// 2. Privzete vrednosti
export const DEFAULT_PROJECT_STAGES: ProjectStageGroup[] = [
    {
        status: 'DRAFT',
        title: 'V PRIPRAVI',
        stages: [
            { id: 'projektno-povprasevanje', title: 'Projektno povpraševanje', order: 1 },
            { id: 'kontakt-stranke', title: 'Kontakt stranke', order: 2 },
            { id: 'ogled-na-objektu', title: 'Ogled na objektu', order: 3 },
            { id: 'priprava-ponudbe', title: 'Priprava ponudbe', order: 4 },
            { id: 'poslana-ponudba', title: 'Poslana ponudba', order: 5 },
            { id: 'potrjen-projekt', title: 'Potrjen projekt', order: 6 }
        ]
    },
    {
        status: 'IN_PROGRESS',
        title: 'V IZVAJANJU',
        stages: [
            { id: 'priprava-materiala', title: 'Priprava materiala', order: 1 },
            { id: 'narocen-material', title: 'Naročen material', order: 2 },
            { id: 'v-delu', title: 'V delu', order: 3 },
            { id: 'opravljena-izvedba', title: 'Opravljena izvedba', order: 4 }
        ]
    },
    {
        status: 'COMPLETED',
        title: 'ZAKLJUČENO',
        stages: [
            { id: 'poslan-racun', title: 'Poslan račun', order: 1 },
            { id: 'zakljucen-projekt', title: 'Zaključen projekt', order: 2 }
        ]
    },
    {
        status: 'CANCELLED',
        title: 'PREKLICANO',
        stages: [
            { id: 'preklicano-stranka', title: 'Preklicano - stranka', order: 1 },
            { id: 'preklicano-izvajalec', title: 'Preklicano - izvajalec', order: 2 }
        ]
    }
];

// 3. Pomožne funkcije
export const findStageById = (stageId: StageId, stages: ProjectStageGroup[]): ProjectStage | undefined => {
    for (const group of stages) {
        const stage = group.stages.find(s => s.id === stageId);
        if (stage) return stage;
    }
    return undefined;
};

export const findStageGroupByStatus = (status: string, stages: ProjectStageGroup[]): ProjectStageGroup | undefined => {
    return stages.find(group => group.status === status);
};

// 4. Validacija
export const validateStageId = (stageId: StageId, stages: ProjectStageGroup[]): boolean => {
    return findStageById(stageId, stages) !== undefined;
};

// 5. Pretvorba v kanban konfiguracijo
export const convertToKanbanConfig = (stages: ProjectStageGroup[]) => {
    return {
        columns: stages.map(group => ({
            status: group.status,
            title: group.title,
            subcategories: group.stages.map(stage => ({
                id: stage.id,
                title: stage.title,
                status: group.status
            }))
        })),
        defaultColumn: 'DRAFT'
    };
};
