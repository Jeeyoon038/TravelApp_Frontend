// useFetchGroups.ts
import { useEffect, useState } from "react";
import axios from "axios";
import { Group } from "../types/group";

export const useFetchGroups = (userId: string) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(`/api/trips`, {
          params: { userId },
        });
        setGroups(response.data); // 서버에서 받은 데이터를 상태에 저장
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchGroups();
    }
  }, [userId]);

  return { groups, loading, error };
};
