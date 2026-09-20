import * as localRepo from './localRepo.js';

// Currently uses localRepo. Supabase implementation can be swapped via VITE_DATA_SOURCE.
const activeRepo = localRepo;

export const listPros = activeRepo.listPros;
export const getPro = activeRepo.getPro;
export const createPro = activeRepo.createPro;
export const getProByManageAccess = activeRepo.getProByManageAccess;
export const updatePro = activeRepo.updatePro;
export const subscribePro = activeRepo.subscribePro;
export const cancelPro = activeRepo.cancelPro;
export const listQualifications = activeRepo.listQualifications;
export const addQualification = activeRepo.addQualification;
export const deleteQualification = activeRepo.deleteQualification;
export const listPendingQualifications = activeRepo.listPendingQualifications;
export const reviewQualification = activeRepo.reviewQualification;
export const listVouches = activeRepo.listVouches;
export const listRawVouchesForPro = activeRepo.listRawVouchesForPro;
export const listRawQualificationsForPro = activeRepo.listRawQualificationsForPro;
export const addContact = activeRepo.addContact;
export const getContact = activeRepo.getContact;
export const addVouch = activeRepo.addVouch;
export const removeVouch = activeRepo.removeVouch;
export const getCallNumber = activeRepo.getCallNumber;
export const listAllVouchesForAdmin = activeRepo.listAllVouchesForAdmin;
export const resetDemoData = activeRepo.resetDemoData;

export default activeRepo;
