import { useState } from 'react'
import { useParams } from 'react-router-dom';
import DraftPrescriptionsPage from './DraftPrescriptionsPage'
import EditDraftPrescriptionPage from './EditDraftPrescriptionPage'

function DraftPrescriptionEditor() {
    const { id } = useParams();
  const [currentView, setCurrentView] = useState('list') // 'list' ou 'edit'
  const [selectedDraftId, setSelectedDraftId] = useState(null)
  
  const handleEditDraft = (draftId) => {
    setSelectedDraftId(draftId)
    setCurrentView('edit')
  }
  
  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedDraftId(null)
  }
  
  return (
    <>
      {currentView === 'list' ? (
        <DraftPrescriptionsPage onEditDraft={handleEditDraft} />
      ) : (
        <EditDraftPrescriptionPage 
          draftId={selectedDraftId} 
          onBack={handleBackToList} 
        />
      )}
    </>
  )
}

export default DraftPrescriptionEditor