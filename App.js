import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ScrollView
} from "react-native";

import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp
} from "firebase/firestore";

import { db } from "./firebase";

export default function App() {

  const [task, setTask] = useState("");
  const [importance, setImportance] = useState("Medium");
  const [context, setContext] = useState("General");
  const [isHabit, setIsHabit] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const tasksRef = collection(db, "tasks");

  // Load tasks in real-time from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(tasksRef, snapshot => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(list);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setTask("");
    setImportance("Medium");
    setContext("General");
    setIsHabit(false);
    setEditingId(null);
  };

  // SAVE or UPDATE task in database
  const handleSaveTask = async () => {
    if (!task.trim()) return;

    // ---- UPDATE EXISTING TASK ----
    if (editingId) {
      try {
        const ref = doc(db, "tasks", editingId);
        await updateDoc(ref, {
          title: task,
          importance,
          context,
          isHabit
        });
        resetForm();
        return;
      } catch (e) {
        console.log("Update error:", e);
      }
    }

    // ---- ADD NEW TASK ----
    try {
      await addDoc(tasksRef, {
        title: task,
        importance,
        context,
        isHabit,
        streak: isHabit ? 1 : 0,
        createdAt: serverTimestamp()
      });
      resetForm();
    } catch (e) {
      console.log("Add error:", e);
    }
  };

  // DELETE task
  const deleteTask = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  // EDIT task — load values into form
  const editTask = (t) => {
    setTask(t.title);
    setImportance(t.importance);
    setContext(t.context);
    setIsHabit(t.isHabit ?? false);
    setEditingId(t.id);
  };

  const sortByPriority = (tasks) => {
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    return [...tasks].sort(
      (a, b) => priorityOrder[b.importance] - priorityOrder[a.importance]
    );
  };

  const focusTasks = sortByPriority(tasks).slice(0, 3);

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.metaText}>
          Priority: {item.importance}   |   Context: {item.context}
        </Text>
        {item.isHabit && (
          <Text style={styles.habitBadge}>
            Habit • Streak: {item.streak ?? 1} days
          </Text>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => editTask(item)}
        >
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteTask(item.id)}
        >
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.pageWrapper}>
      <ScrollView contentContainerStyle={styles.scrollArea}>
        <View style={styles.container}>

          <Text style={styles.heading}>Smart Productivity To-Do</Text>

          {/* NEW TASK BUTTON */}
          <TouchableOpacity
            style={styles.newTaskBtn}
            onPress={resetForm}
          >
            <Text style={styles.newTaskText}>+ New Task</Text>
          </TouchableOpacity>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              value={task}
              onChangeText={setTask}
              placeholder="Enter task name"
              placeholderTextColor="#666"
            />

            <View style={styles.row}>
              {["High","Medium","Low"].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.tag,
                    importance === level && styles.activeTag
                  ]}
                  onPress={() => setImportance(level)}
                >
                  <Text>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              {["General","Home","Study","Work","Errands"].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.contextChip,
                    context === c && styles.activeChip
                  ]}
                  onPress={() => setContext(c)}
                >
                  <Text>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.habitToggle, isHabit && styles.habitOn]}
              onPress={() => setIsHabit(!isHabit)}
            >
              <Text style={{ fontWeight: "600" }}>
                {isHabit ? "Habit Enabled" : "Mark as Habit Task"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveTask}
            >
              <Text style={styles.saveText}>
                {editingId ? "Update Task" : "Add Task"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Focus Mode — Top 3 Tasks</Text>

          <FlatList
            data={focusTasks}
            renderItem={renderTask}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />

          <Text style={styles.sectionTitle}>All Tasks</Text>

          <FlatList
            data={sortByPriority(tasks)}
            renderItem={renderTask}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrapper: { flex: 1, backgroundColor: "#f5f6fa" },
  scrollArea: { alignItems: "center", paddingTop: 40, paddingBottom: 80 },
  container: {
    width: "100%", maxWidth: 900,
    backgroundColor: "#ffffff",
    padding: 20, borderRadius: 16,
    borderWidth: 1, borderColor: "#d4d4d4"
  },
  heading: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 15, textAlign: "center" },

  // NEW TASK BUTTON
  newTaskBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#4dabff",
    alignItems: "center",
    marginBottom: 16
  },
  newTaskText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 16
  },

  inputBox: {
    backgroundColor: "#fafafa",
    padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: "#e5e5e5",
    marginBottom: 20
  },
  input: {
    backgroundColor: "#ffffff",
    color: "#111", padding: 12,
    borderRadius: 8, borderWidth: 1,
    borderColor: "#cfcfcf", marginBottom: 12,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  tag: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#e7e7e7" },
  activeTag: { backgroundColor: "#c7e3ff", borderWidth: 1, borderColor: "#5aa2ff" },
  contextChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: "#ededed" },
  activeChip: { backgroundColor: "#d7d2ff", borderWidth: 1, borderColor: "#7a61ff" },
  habitToggle: { padding: 10, borderRadius: 10, backgroundColor: "#ededed", marginBottom: 12 },
  habitOn: { backgroundColor: "#c9f5d6", borderWidth: 1, borderColor: "#3da35a" },
  saveBtn: { padding: 12, borderRadius: 10, backgroundColor: "#4dabff", alignItems: "center" },
  saveText: { fontWeight: "700", color: "#000" },
  sectionTitle: { color: "#222", fontSize: 18, marginTop: 18, marginBottom: 8 },
  taskCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1, borderColor: "#d8d8d8",
    padding: 12, borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row", gap: 10
  },
  taskTitle: { color: "#000", fontSize: 16, fontWeight: "700" },
  metaText: { color: "#444", fontSize: 12 },
  habitBadge: { color: "#2f8f46", fontSize: 12, marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 6 },
  editBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#ffe9a8" },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#ffc7c7" },
  btnText: { fontWeight: "600", color: "#000" }
});
