import { ChevronRight, FlaskConical, Plus, Trash2 } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../components/Card";
import type { Scene } from "../domain/scene/Scene";
import type { Observation } from "../domain/observation/Observation";

interface SceneListScreenProps {
  projectName: string; scenes: Scene[]; observations: Observation[];
  onBack: () => void; onNewScene: () => void; onSelectScene: (scene: Scene) => void; onEditScene: (scene: Scene) => void; onDeleteScene: (scene: Scene) => void;
}

export function SceneListScreen({ projectName, scenes, observations, onBack, onNewScene, onSelectScene, onEditScene, onDeleteScene }: SceneListScreenProps) {
  function confirmDelete(scene: Scene) {
    const count = observations.filter((o) => o.sceneId === scene.id).length;
    if (count > 0) { Alert.alert("Scene contains observations", "Delete its observations first before deleting the scene."); return; }
    Alert.alert("Delete scene?", `"${scene.name}" will be permanently deleted.`, [{text:"Cancel",style:"cancel"},{text:"Delete",style:"destructive",onPress:()=>onDeleteScene(scene)}]);
  }
  return <View style={styles.container}>
    <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>Projects</Text></Pressable><Pressable style={styles.primaryButton} onPress={onNewScene}><Plus size={18} color="#fff"/><Text style={styles.primaryButtonText}>New Scene</Text></Pressable></View>
    <Text style={styles.title}>{projectName}</Text><Text style={styles.subtitle}>Scenes provide context for observations within this project.</Text>
    {scenes.length === 0 ? <Card><View style={styles.emptyIcon}><FlaskConical size={28} color="#555"/></View><Text style={styles.emptyTitle}>No scenes yet</Text><Text style={styles.emptyText}>Create a scene for an experiment, sample, setup, or other context.</Text><Pressable style={styles.primaryButton} onPress={onNewScene}><Plus size={18} color="#fff"/><Text style={styles.primaryButtonText}>New Scene</Text></Pressable></Card> : scenes.map((scene) => {
      const count=observations.filter((o)=>o.sceneId===scene.id).length;
      return <Card key={scene.id}><View style={styles.row}><Pressable style={styles.main} onPress={()=>onSelectScene(scene)}><Text style={styles.name}>{scene.name}</Text>{scene.description ? <Text style={styles.description}>{scene.description}</Text> : null}<Text style={styles.meta}>{count} observation{count===1?"":"s"}</Text></Pressable><Pressable onPress={()=>onEditScene(scene)} style={styles.iconButton}><Text style={styles.edit}>Edit</Text></Pressable><Pressable onPress={()=>confirmDelete(scene)} style={styles.iconButton}><Trash2 size={19} color="#999"/></Pressable><ChevronRight size={22} color="#777"/></View></Card>;
    })}
  </View>;
}
const styles=StyleSheet.create({container:{marginTop:8},header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:18},back:{paddingVertical:10,paddingRight:12},backText:{fontSize:16,color:"#555"},title:{fontSize:28,fontWeight:"700"},subtitle:{marginTop:6,marginBottom:20,fontSize:15,lineHeight:22,color:"#666"},primaryButton:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:8,paddingHorizontal:16,paddingVertical:11,borderRadius:8,backgroundColor:"#2563EB"},primaryButtonText:{color:"#fff",fontSize:15,fontWeight:"600"},emptyIcon:{alignItems:"center",justifyContent:"center",width:56,height:56,marginBottom:16,borderRadius:28,backgroundColor:"#F0F1F3"},emptyTitle:{fontSize:20,fontWeight:"600",marginBottom:8},emptyText:{fontSize:15,lineHeight:22,color:"#666",marginBottom:20},row:{flexDirection:"row",alignItems:"center"},main:{flex:1},name:{fontSize:17,fontWeight:"600"},description:{marginTop:5,fontSize:14,color:"#555"},meta:{marginTop:6,fontSize:14,color:"#777"},iconButton:{padding:8,marginLeft:2},edit:{fontSize:14,color:"#555",fontWeight:"600"}});
