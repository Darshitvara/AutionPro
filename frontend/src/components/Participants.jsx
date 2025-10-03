function Participants({ participants, currentUsername }) {
  return (
    <div className="participants-card">
      <h3>👥 Participants</h3>
      
      <div className="participants-list">
        {participants.length === 0 ? (
          <div style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>
            No participants
          </div>
        ) : (
          participants.map((participant, index) => (
            <div
              key={index}
              className={`participant-item ${
                participant === currentUsername ? 'current-user' : ''
              }`}
            >
              👤 {participant}
              {participant === currentUsername && ' (You)'}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Participants
