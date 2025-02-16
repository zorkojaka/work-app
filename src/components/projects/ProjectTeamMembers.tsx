/**** začetek razdelka 1 - imports ****/
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { ProjectTeamMember } from '../../types/project';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    roles: string[];
}

interface ProjectTeamMembersProps {
    projectId: string;
    team: Record<string, ProjectTeamMember>;
    onTeamUpdate: (newTeam: Record<string, ProjectTeamMember>) => void;
}
/**** konec razdelka 1 ****/

/**** začetek razdelka 2 - component & state ****/
const ProjectTeamMembers: React.FC<ProjectTeamMembersProps> = ({
    projectId,
    team,
    onTeamUpdate
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<string>('INSTALLER');
/**** konec razdelka 2 ****/

/**** začetek razdelka 3 - effects & handlers ****/
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, 'users');
                const querySnapshot = await getDocs(usersRef);
                const userData = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as User[];
                setUsers(userData);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    const handleAddMember = () => {
        if (!selectedUserId) return;

        const newTeam = {
            ...team,
            [selectedUserId]: {
                userId: selectedUserId,
                role: selectedRole,
                tasks: []
            }
        };

        onTeamUpdate(newTeam);
        setSelectedUserId('');
    };

    const handleRemoveMember = (userId: string) => {
        const newTeam = { ...team };
        delete newTeam[userId];
        onTeamUpdate(newTeam);
    };
/**** konec razdelka 3 ****/

/**** začetek razdelka 4 - render helpers ****/
    const getMemberName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : 'Neznani uporabnik';
    };
/**** konec razdelka 4 ****/

/**** začetek razdelka 5 - render ****/
    return (
        <div className="mt-4">
            <h3 className="text-lg font-medium mb-4">Člani ekipe</h3>
            
            {/* Add member form */}
            <div className="flex gap-2 mb-4">
                <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="">Izberi člana</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                        </option>
                    ))}
                </select>
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="INSTALLER">Monter</option>
                    <option value="PROJECT_MANAGER">Vodja projekta</option>
                </select>
                <button
                    onClick={handleAddMember}
                    disabled={!selectedUserId}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                    Dodaj
                </button>
            </div>

            {/* Team members list */}
            <div className="space-y-2">
                {Object.entries(team).map(([userId, member]) => (
                    <div key={userId} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <div>
                            <span className="font-medium">{getMemberName(userId)}</span>
                            <span className="ml-2 text-sm text-gray-600">
                                {member.role === 'INSTALLER' ? 'Monter' : 'Vodja projekta'}
                            </span>
                        </div>
                        <button
                            onClick={() => handleRemoveMember(userId)}
                            className="text-red-500 hover:text-red-700"
                        >
                            Odstrani
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectTeamMembers;
/**** konec razdelka 5 ****/