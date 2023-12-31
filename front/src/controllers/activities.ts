// @ts-nocheck
import { collection, doc, getFirestore, query, setDoc, updateDoc, deleteField } from "@firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { firebaseApp } from "../main";
import UserContext from "../usercontext";
import { DocumentData, getDocs, onSnapshot, QueryDocumentSnapshot, QuerySnapshot } from "firebase/firestore";

export type VoteCount = {
    emoji: string;
    count: number;
};

export type Activity = {
    id: string;
    name: string;
    emoji: string;
    place: string;
    time: string;
    customTime: string | null;
    owner: string;
    votes: { emoji: string; count: number; haveIVoted: boolean }[];
    group: Array<string>;
    ongoing?: boolean;
};

/**
 * Fetch all activities currently in Firestore
 */
const fetchActivities = async (): Promise<Activity[]> => {
    const db = getFirestore(firebaseApp);
    const q = query(collection(db, "activities"));
    const activities: Activity[] = [];
    const snapshot = await getDocs(q);
    snapshot.forEach(x => {
        const a = {
            ...x.data(),
            id: x.id,
            votes: JSON.parse(x.data().votes),
        } as Activity;
        activities.push(a);
    });
    console.log(activities);
    return activities;
};

const useActivities = () => {
    const user = useContext(UserContext);

    const db = getFirestore(firebaseApp);

    const [allActivities, setAllActivities] = useState<Activity[]>([]);

    useEffect(() => {
        const q = query(collection(db, "activities"));

        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            const updatedActivities: Activity[] = [];
            snapshot.forEach((doc: QueryDocumentSnapshot<unknown>) => {
                const data = doc.data();
                const votes = {};

                Object.keys(data.votes).forEach(voterId => {
                    const emoji = data.votes[voterId];
                    if (!(emoji in votes)) votes[emoji] = { emoji, count: 0, haveIVoted: false };
                    votes[emoji].count += 1;
                    if (voterId === user.id) {
                        votes[emoji].haveIVoted = true;
                    }
                });

                console.log(votes);

                return updatedActivities.push({
                    id: doc.id,
                    ...data,
                    votes: Object.values(votes).sort((a, b) => a.emoji?.localeCompare(b.emoji)),
                } as Activity);
            });

            console.log(updatedActivities);
            setAllActivities(updatedActivities);
            console.log("Updated activities!");
        });
        return unsubscribe;
    }, [db, user?.id]);

    const vote = async (activityId: string, emoji: string, vote?: boolean) => {
        vote = vote ?? true;

        const ref = doc(db, "activities", activityId);
        if (vote) {
            await updateDoc(ref, `votes.${user?.id}`, emoji);
        } else {
            await updateDoc(ref, `votes.${user?.id}`, deleteField());
        }
        // await setDoc(ref, { votes:  }, { merge: true });
    };

    return { data: allActivities, isLoading: allActivities.length == 0, vote };

    // const queryKey: fetchActivitiesQueryKey = ["activities", user?.id];
    // return useQuery(queryKey, fetchActivities, { refetchInterval: 1000 });
};

/**
 * Write a new activity to Firestore
 * @returns The ID of the new activity
 */
const writeActivity = async (activity: Omit<Activity, "id" | "votes"> & { votes: string }): Promise<string> => {
    const db = getFirestore(firebaseApp);
    // Add a new document in collection "cities"
    const ref = doc(collection(db, "activities"));
    await setDoc(ref, activity);
    return ref.id;
};

const useCreateActivity = () => {
    const user = useContext(UserContext);
    if (!user) throw Error("User not defined in useCreateActivity");

    const randomVote = emoji => {
        const res = {};
        const amount = Math.floor(Math.random() * 3);
        for (let i = 1; i <= amount; ++i) {
            res[`_${emoji}`.repeat(i)] = emoji;
        }
        return res;
    };

    return async (activity: { name: string; emoji: string; place: string; time: string; customTime: string | undefined }): Promise<string> => {
        const votes = { ...randomVote("🚀"), ...randomVote("🔥"), ...randomVote("👍"), ...randomVote("💻") };
        console.log(votes);
        const id = await writeActivity({
            name: activity.name,
            emoji: activity.emoji,
            place: activity.place,
            time: activity.time,
            customTime: activity.customTime || null,
            votes: votes,
            group: [],
            owner: user?.name,
        });
        return id;
    };
};

/**
 * Share the activity with the given groups. Existing groups will be overwritten.
 */
const modifyActivityGroups = async (activityId: string, groupsToShareWith: string[]) => {
    const db = getFirestore(firebaseApp);
    // Add a new document in collection "cities"
    const ref = doc(db, "activities", activityId);
    await setDoc(ref, { group: groupsToShareWith }, { merge: true });
};

export { useActivities, useCreateActivity, modifyActivityGroups };
