
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Company, FiscalYear, SortDirection, SortKey } from './types';

// --- MOCK DATA ---
const MOCK_COMPANIES: Company[] = [
  { id: 1, name: '프론트엔드 솔루션즈', registrationNumber: '111-81-12345' },
  { id: 2, name: '백엔드 시스템즈', registrationNumber: '222-86-54321' },
  { id: 3, name: 'UI/UX 디자인랩', registrationNumber: '333-88-67890' },
];

const MOCK_FISCAL_YEARS: FiscalYear[] = [
  { id: 1, companyId: 1, year: '2023', startDate: '20230101', endDate: '20231231', isMain: true, remarks: '2023년도 정기' },
  { id: 2, companyId: 1, year: '2022', startDate: '20220101', endDate: '20221231', isMain: false, remarks: '2022년도' },
  { id: 3, companyId: 2, year: '2023', startDate: '20230401', endDate: '20240331', isMain: true, remarks: '3월 결산 법인' },
  { id: 4, companyId: 1, year: '2021', startDate: '20210101', endDate: '20211231', isMain: false, remarks: ''},
  { id: 5, companyId: 1, year: '2020', startDate: '20200101', endDate: '20201231', isMain: false, remarks: '코로나 시기'},
  { id: 6, companyId: 3, year: '2023', startDate: '20230101', endDate: '20231231', isMain: true, remarks: '초기 설정'},
];


// --- SVG ICONS ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);


// --- HELPER COMPONENTS ---

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed top-5 right-5 ${bgColor} text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-down`}>
      {message}
    </div>
  );
};


interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors">
            취소
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

interface FiscalYearModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (fiscalYear: Omit<FiscalYear, 'id' | 'companyId'> & { id?: number }) => void;
    existingFiscalYears: FiscalYear[];
    initialData: FiscalYear | null;
}

const FiscalYearModal: React.FC<FiscalYearModalProps> = ({ isOpen, onClose, onSave, existingFiscalYears, initialData }) => {
    const [formData, setFormData] = useState({ year: '', startDate: '', endDate: '', isMain: false, remarks: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                year: initialData.year,
                startDate: initialData.startDate,
                endDate: initialData.endDate,
                isMain: initialData.isMain,
                remarks: initialData.remarks,
            });
        } else {
            setFormData({ year: '', startDate: '', endDate: '', isMain: false, remarks: '' });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.year.match(/^\d{4}$/)) newErrors.year = 'YYYY 형식으로 입력하세요.';
        if (!formData.startDate.match(/^\d{8}$/)) newErrors.startDate = 'YYYYMMDD 형식으로 입력하세요.';
        if (!formData.endDate.match(/^\d{8}$/)) newErrors.endDate = 'YYYYMMDD 형식으로 입력하세요.';
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }

        if (formData.startDate >= formData.endDate) {
            newErrors.endDate = '종료일은 시작일보다 이후여야 합니다.';
        }

        const isOverlapping = existingFiscalYears
            .filter(fy => fy.id !== initialData?.id)
            .some(fy => (formData.startDate <= fy.endDate && formData.endDate >= fy.startDate));

        if (isOverlapping) {
            newErrors.startDate = '기존 사업연도와 기간이 중복됩니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            onSave({ ...formData, id: initialData?.id });
            onClose();
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    if (!isOpen) return null;

    const InputField = ({ label, name, value, onChange, error, ...props }: any) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                {...props}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg space-y-6">
                <h2 className="text-xl font-bold text-slate-800">{initialData ? '사업연도 수정' : '사업연도 추가'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="사업연도" name="year" value={formData.year} onChange={handleChange} error={errors.year} placeholder="YYYY" />
                    <InputField label="시작일" name="startDate" value={formData.startDate} onChange={handleChange} error={errors.startDate} placeholder="YYYYMMDD" />
                    <InputField label="종료일" name="endDate" value={formData.endDate} onChange={handleChange} error={errors.endDate} placeholder="YYYYMMDD" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">비고</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                </div>
                <div className="flex items-center">
                    <input type="checkbox" id="isMain" name="isMain" checked={formData.isMain} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="isMain" className="ml-2 block text-sm text-slate-900">사업연도의제 여부</label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors">취소</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">저장</button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const CompanyManager: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
    const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>(MOCK_FISCAL_YEARS);
    
    const [activeCompany, setActiveCompany] = useState<Company | null>(companies[0] || null);
    const [formState, setFormState] = useState<Partial<Company>>(companies[0] || {});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isNewMode, setIsNewMode] = useState(false);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [dialog, setDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    const [modal, setModal] = useState<{ isOpen: boolean; initialData: FiscalYear | null }>({ isOpen: false, initialData: null });

    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (activeCompany) {
            setFormState(activeCompany);
            setIsNewMode(false);
            setFormErrors({});
        } else {
            setFormState({});
            setIsNewMode(true)
        }
    }, [activeCompany]);

    const handleSelectCompany = (id: number) => {
        const company = companies.find(c => c.id === id);
        setActiveCompany(company || null);
    };

    const handleNew = () => {
        setActiveCompany(null);
        setFormState({ name: '', registrationNumber: ''});
        setIsNewMode(true);
        setFormErrors({});
    };

    const validateCompanyForm = () => {
        const errors: Record<string, string> = {};
        if (!formState.name?.trim()) {
            errors.name = '법인명을 입력해주세요.';
        }
        if (!formState.registrationNumber?.match(/^\d{3}-\d{2}-\d{5}$/)) {
            errors.registrationNumber = '사업자등록번호 형식이 올바르지 않습니다 (###-##-#####).';
        }
        const duplicate = companies.some(c => c.registrationNumber === formState.registrationNumber && c.id !== formState.id);
        if (duplicate) {
            errors.registrationNumber = '이미 등록된 사업자등록번호입니다.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = () => {
        if (!validateCompanyForm()) return;

        if (isNewMode) {
            const newCompany: Company = {
                id: Date.now(),
                name: formState.name!,
                registrationNumber: formState.registrationNumber!,
            };
            setCompanies(prev => [...prev, newCompany]);
            setActiveCompany(newCompany);
            setToast({ message: '법인이 성공적으로 등록되었습니다.', type: 'success' });
        } else if(activeCompany) {
            setCompanies(prev => prev.map(c => c.id === activeCompany.id ? { ...c, ...formState } : c));
            setToast({ message: '법인 정보가 성공적으로 수정되었습니다.', type: 'success' });
        }
    };
    
    const handleDelete = () => {
        if (!activeCompany) return;
        setDialog({
            isOpen: true,
            title: '법인 삭제',
            message: `'${activeCompany.name}' 법인과 관련된 모든 사업연도 정보가 삭제됩니다. 정말 삭제하시겠습니까?`,
            onConfirm: () => {
                setCompanies(prev => prev.filter(c => c.id !== activeCompany.id));
                setFiscalYears(prev => prev.filter(fy => fy.companyId !== activeCompany.id));
                setActiveCompany(companies[0] || null);
                setToast({ message: '법인이 삭제되었습니다.', type: 'success' });
                setDialog({ ...dialog, isOpen: false });
            }
        });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const activeFiscalYears = useMemo(() => {
        return fiscalYears.filter(fy => fy.companyId === activeCompany?.id);
    }, [fiscalYears, activeCompany]);

    const sortedFiscalYears = useMemo(() => {
        let sortableItems = [...activeFiscalYears];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [activeFiscalYears, sortConfig]);

    const paginatedFiscalYears = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedFiscalYears.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedFiscalYears, currentPage]);
    
    const totalPages = Math.ceil(sortedFiscalYears.length / itemsPerPage);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = SortDirection.ASC;
        if (sortConfig && sortConfig.key === key && sortConfig.direction === SortDirection.ASC) {
            direction = SortDirection.DESC;
        }
        setSortConfig({ key, direction });
    };

    const handleSaveFiscalYear = (data: Omit<FiscalYear, 'id' | 'companyId'> & { id?: number }) => {
        if (!activeCompany) return;

        let updatedFiscalYears = [...fiscalYears];
        if (data.isMain) {
            updatedFiscalYears = updatedFiscalYears.map(fy => 
                fy.companyId === activeCompany.id ? { ...fy, isMain: false } : fy
            );
        }
        
        if (data.id) { // Edit
            setFiscalYears(updatedFiscalYears.map(fy => fy.id === data.id ? { ...fy, ...data, companyId: activeCompany.id } : fy));
            setToast({ message: '사업연도가 수정되었습니다.', type: 'success' });
        } else { // Add
            const newFiscalYear: FiscalYear = {
                ...data,
                id: Date.now(),
                companyId: activeCompany.id,
            };
            setFiscalYears([...updatedFiscalYears, newFiscalYear]);
            setToast({ message: '사업연도가 추가되었습니다.', type: 'success' });
        }
    };

    const handleDeleteFiscalYear = (id: number) => {
        setDialog({
            isOpen: true,
            title: '사업연도 삭제',
            message: '이 사업연도를 삭제하시겠습니까?',
            onConfirm: () => {
                setFiscalYears(fiscalYears.filter(fy => fy.id !== id));
                setToast({ message: '사업연도가 삭제되었습니다.', type: 'success' });
                setDialog({ ...dialog, isOpen: false });
            }
        });
    };

    const format_YYYYMMDD = (dateStr: string) => {
        if (dateStr.length !== 8) return dateStr;
        return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    };

    const getSortIndicator = (key: SortKey) => {
      if (!sortConfig || sortConfig.key !== key) return '↕';
      return sortConfig.direction === SortDirection.ASC ? '↑' : '↓';
    };

    return (
        <div className="p-8 font-sans">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmationDialog 
                isOpen={dialog.isOpen} 
                title={dialog.title} 
                message={dialog.message} 
                onConfirm={dialog.onConfirm} 
                onCancel={() => setDialog({ ...dialog, isOpen: false })} 
            />
            <FiscalYearModal
                isOpen={modal.isOpen}
                onClose={() => setModal({isOpen: false, initialData: null})}
                onSave={handleSaveFiscalYear}
                existingFiscalYears={activeFiscalYears}
                initialData={modal.initialData}
            />

            <h1 className="text-2xl font-bold text-slate-800 mb-6">법인관리</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                     <div className="flex items-center gap-2">
                        <label htmlFor="company-select" className="text-sm font-medium">법인 선택:</label>
                        <select
                            id="company-select"
                            value={activeCompany?.id || ''}
                            onChange={(e) => handleSelectCompany(Number(e.target.value))}
                            className="p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="" disabled>법인을 선택하세요</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={handleNew} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors">신규</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">저장</button>
                        <button onClick={handleDelete} disabled={!activeCompany} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">삭제</button>
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="text-lg font-semibold text-slate-700 mb-4 p-3 bg-slate-50 rounded-t-md border-b">법인 정보</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">법인명</label>
                            <input
                                type="text"
                                name="name"
                                value={formState.name || ''}
                                onChange={handleFormChange}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">법인등록번호</label>
                            <input
                                type="text"
                                name="registrationNumber"
                                value={formState.registrationNumber || ''}
                                onChange={handleFormChange}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {formErrors.registrationNumber && <p className="text-red-500 text-xs mt-1">{formErrors.registrationNumber}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-700">사업연도 등록</h2>
                    <button 
                        onClick={() => setModal({ isOpen: true, initialData: null })}
                        disabled={isNewMode || !activeCompany}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        <PlusIcon />
                        추가
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {([
                                    { key: 'year', label: '사업연도'},
                                    { key: 'startDate', label: '시작일'},
                                    { key: 'endDate', label: '종료일'},
                                ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                                    <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(key)}>
                                        {label} <span className="text-slate-400">{getSortIndicator(key)}</span>
                                    </th>
                                ))}
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">의제여부</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">비고</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                           {paginatedFiscalYears.length > 0 ? paginatedFiscalYears.map(fy => (
                                <tr key={fy.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{fy.year}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{format_YYYYMMDD(fy.startDate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{format_YYYYMMDD(fy.endDate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">
                                      {fy.isMain && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Main</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-xs">{fy.remarks}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button onClick={() => setModal({ isOpen: true, initialData: fy })} className="text-indigo-600 hover:text-indigo-900"><PencilIcon/></button>
                                            <button onClick={() => handleDeleteFiscalYear(fy.id)} className="text-red-600 hover:text-red-900"><TrashIcon/></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-500">데이터가 없습니다.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-4 space-x-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


export default CompanyManager;

// App wrapper
const App = () => (
    <div className="min-h-screen bg-slate-100">
        <CompanyManager />
    </div>
);
