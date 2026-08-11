import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Label } from '@/components/ui';
import { Plus, Trash, Shield, CheckCircle2 } from 'lucide-react';
import { getRoles, saveRoles, ALL_PERMISSIONS, type RoleDef, type Permission } from '@/lib/rbac';

export function RolesSettings() {
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [editingRole, setEditingRole] = useState<RoleDef | null>(null);

  useEffect(() => {
    setRoles(getRoles());
  }, []);

  const handleSaveRole = () => {
    if (!editingRole) return;
    
    let updated = [...roles];
    if (editingRole.id.startsWith('new_')) {
      const newRole = { ...editingRole, id: `role_${Date.now()}` };
      updated.push(newRole);
    } else {
      updated = updated.map(r => r.id === editingRole.id ? editingRole : r);
    }
    
    setRoles(updated);
    saveRoles(updated);
    setEditingRole(null);
  };

  const handleDeleteRole = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الصلاحية؟')) {
      const updated = roles.filter(r => r.id !== id);
      setRoles(updated);
      saveRoles(updated);
    }
  };

  const togglePermission = (perm: Permission) => {
    if (!editingRole) return;
    const has = editingRole.permissions.includes(perm);
    let newPerms = [...editingRole.permissions];
    if (has) {
      newPerms = newPerms.filter(p => p !== perm);
    } else {
      newPerms.push(perm);
    }
    setEditingRole({ ...editingRole, permissions: newPerms });
  };

  const groupedPermissions = ALL_PERMISSIONS.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS>);

  return (
    <Card>
      <CardBody className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-surface-800 flex items-center gap-2">
            <Shield className="text-primary-600" /> إدارة الأدوار والصلاحيات
          </h3>
          <Button onClick={() => setEditingRole({ id: 'new_', name: 'دور جديد', permissions: [] })} size="sm" variant="outline" className="text-primary-700 border-primary-200">
            <Plus className="w-4 h-4 ml-2" /> إضافة دور
          </Button>
        </div>

        {editingRole ? (
          <div className="border border-surface-200 rounded-xl p-5 bg-surface-50 space-y-6">
            <div>
              <Label className="font-bold">اسم الدور</Label>
              <Input 
                value={editingRole.name} 
                onChange={e => setEditingRole({...editingRole, name: e.target.value})} 
                disabled={editingRole.is_system}
                className="max-w-xs mt-1 bg-white" 
              />
            </div>
            
            <div>
              <Label className="font-bold mb-3 block">تحديد الصلاحيات</Label>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([group, perms]) => (
                  <div key={group}>
                    <h4 className="text-sm font-bold text-surface-500 mb-3 pb-2 border-b border-surface-200">{group}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map(p => {
                        const isSelected = editingRole.permissions.includes(p.key);
                        return (
                          <div 
                            key={p.key} 
                            onClick={() => togglePermission(p.key)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-primary-100 border-primary-400' : 'bg-white border-surface-200 hover:border-primary-300'}`}
                          >
                            <span className={`text-sm ${isSelected ? 'font-bold text-primary-900' : 'text-surface-600'}`}>{p.label}</span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-primary-600" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
              <Button onClick={() => setEditingRole(null)} variant="outline">إلغاء</Button>
              <Button onClick={handleSaveRole} className="bg-primary-600 hover:bg-primary-700">حفظ الدور</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(r => (
              <div key={r.id} className="p-4 border border-surface-200 rounded-xl hover:border-primary-300 transition-colors bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-surface-800 text-lg flex items-center gap-2">
                      {r.name}
                      {r.is_system && <span className="text-[10px] bg-surface-100 text-surface-500 px-2 py-0.5 rounded-full font-normal">أساسي</span>}
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setEditingRole(r)} variant="outline" size="sm" className="h-8 text-xs px-3">تعديل</Button>
                    {!r.is_system && (
                      <button onClick={() => handleDeleteRole(r.id)} className="text-rose-500 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors">
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-surface-500">{r.permissions.length} صلاحية مفعلة</p>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
