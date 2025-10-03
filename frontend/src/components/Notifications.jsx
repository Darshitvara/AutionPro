function Notifications({ notifications }) {
  return (
    <div className="notifications-card">
      <h3>📢 Live Updates</h3>
      
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>
            No notifications yet
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className={`notification ${notif.type}`}>
              {notif.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Notifications
