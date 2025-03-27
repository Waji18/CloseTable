import { useEffect, useState } from "react";
import {
  getPendingRestaurants,
  approveRestaurant,
  rejectRestaurant,
} from "../../api/admin";

const ApprovalsPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const data = await getPendingRestaurants();
        setPending(data);
      } catch (error) {
        console.error("Failed to load pending restaurants:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPending();
  }, []);

  const handleDecision = async (id, approve) => {
    try {
      if (approve) {
        await approveRestaurant(id);
      } else {
        await rejectRestaurant(id);
      }
      setPending(pending.filter((r) => r._id !== id));
    } catch (error) {
      console.error("Decision failed:", error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="approvals-container">
      <h1>Pending Restaurant Approvals</h1>
      {pending.length === 0 ? (
        <div className="empty-state">No pending approvals</div>
      ) : (
        pending.map((restaurant) => (
          <RestaurantApprovalCard
            key={restaurant._id}
            restaurant={restaurant}
            onApprove={() => handleDecision(restaurant._id, true)}
            onReject={() => handleDecision(restaurant._id, false)}
          />
        ))
      )}
    </div>
  );
};
