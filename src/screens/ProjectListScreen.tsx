import { ChevronRight, Folder, Plus, Trash2 } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import type { Project } from "../domain/project/Project";
import type { Scene } from "../domain/scene/Scene";

interface ProjectListScreenProps {
  projects: Project[];
  scenes: Scene[];
  onNewProject: () => void;
  onSelectProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

export function ProjectListScreen({ projects, scenes, onNewProject, onSelectProject, onEditProject, onDeleteProject }: ProjectListScreenProps) {
  function confirmDelete(project: Project) {
    const projectScenes = scenes.filter((scene) => scene.projectId === project.id);
    if (projectScenes.length > 0) {
      Alert.alert("Project contains scenes", "Delete its scenes first before deleting the project.");
      return;
    }
    Alert.alert("Delete project?", `"${project.name}" will be permanently deleted.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDeleteProject(project) },
    ]);
  }

  return <View style={styles.container}>
    <View style={styles.header}>
      <View><Text style={styles.title}>Projects</Text><Text style={styles.subtitle}>Organize related experiments and observations.</Text></View>
      <Pressable style={styles.primaryButton} onPress={onNewProject}><Plus size={18} color="#fff"/><Text style={styles.primaryButtonText}>New Project</Text></Pressable>
    </View>
    {projects.length === 0 ? <Card><View style={styles.emptyIcon}><Folder size={28} color="#555"/></View><Text style={styles.emptyTitle}>No projects yet</Text><Text style={styles.emptyText}>Create a project to organize one or more experimental contexts.</Text><Pressable style={styles.primaryButton} onPress={onNewProject}><Plus size={18} color="#fff"/><Text style={styles.primaryButtonText}>New Project</Text></Pressable></Card> : projects.map((project) => {
      const count = scenes.filter((scene) => scene.projectId === project.id).length;
      return <Card key={project.id}><View style={styles.row}>
        <Pressable style={styles.main} onPress={() => onSelectProject(project)}><Text style={styles.name}>{project.name}</Text><Text style={styles.meta}>{count} scene{count === 1 ? "" : "s"}</Text></Pressable>
        <Pressable onPress={() => onEditProject(project)} style={styles.iconButton}><Text style={styles.edit}>Edit</Text></Pressable>
        <Pressable onPress={() => confirmDelete(project)} style={styles.iconButton}><Trash2 size={19} color="#999"/></Pressable>
        <ChevronRight size={22} color="#777"/>
      </View></Card>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  container:{marginTop:8}, header:{flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}, title:{fontSize:28,fontWeight:"700"}, subtitle:{marginTop:6,fontSize:14,color:"#666",maxWidth:260}, primaryButton:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:8,paddingHorizontal:16,paddingVertical:11,borderRadius:8,backgroundColor:"#2563EB"}, primaryButtonText:{color:"#fff",fontSize:15,fontWeight:"600"}, emptyIcon:{alignItems:"center",justifyContent:"center",width:56,height:56,marginBottom:16,borderRadius:28,backgroundColor:"#F0F1F3"}, emptyTitle:{fontSize:20,fontWeight:"600",marginBottom:8}, emptyText:{fontSize:15,lineHeight:22,color:"#666",marginBottom:20}, row:{flexDirection:"row",alignItems:"center"}, main:{flex:1}, name:{fontSize:17,fontWeight:"600"}, meta:{marginTop:6,fontSize:14,color:"#666"}, iconButton:{padding:8,marginLeft:2}, edit:{fontSize:14,color:"#555",fontWeight:"600"}
});
