import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {apiClient} from '@api/client';
import {ar} from '@i18n/ar';

interface Category {
  id: number;
  name: string;
  icon: string;
  selected: boolean;
}

export default function ServicesManagementScreen() {
  const qc = useQueryClient();

  const {data: categories, isLoading} = useQuery({
    queryKey: ['categories-with-selection'],
    queryFn: async () => {
      const [catRes, myRes] = await Promise.all([
        apiClient.get('/categories'),
        apiClient.get('/technicians/me/services'),
      ]);
      const myIds = new Set((myRes.data.data as Array<{category_id: number}>).map(s => s.category_id));
      return (catRes.data.data as Category[]).map(c => ({...c, selected: myIds.has(c.id)}));
    },
  });

  const toggle = useMutation({
    mutationFn: async ({id, selected}: {id: number; selected: boolean}) => {
      if (selected) {
        await apiClient.delete(`/technicians/me/services/${id}`);
      } else {
        await apiClient.post('/technicians/me/services', {categoryId: id});
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['categories-with-selection']});
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err.response?.data?.message ?? ar.common.error);
    },
  });

  const renderItem = ({item}: {item: Category}) => (
    <TouchableOpacity
      style={[styles.catCard, item.selected && styles.catCardSelected]}
      onPress={() => toggle.mutate({id: item.id, selected: item.selected})}>
      <Text style={styles.catIcon}>{item.icon}</Text>
      <Text style={[styles.catName, item.selected && styles.catNameSelected]}>{item.name}</Text>
      {item.selected && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1a237e" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>اختر التخصصات التي تقدم خدماتها</Text>
      <FlatList
        data={categories ?? []}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  hint: {fontSize: 13, color: '#666', padding: 16, fontFamily: 'Cairo-Regular'},
  list: {paddingHorizontal: 12, paddingBottom: 20},
  row: {justifyContent: 'space-between', marginBottom: 12},
  catCard: {
    flex: 0.48,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  catCardSelected: {borderColor: '#1a237e', backgroundColor: '#e8eaf6'},
  catIcon: {fontSize: 30, marginBottom: 8},
  catName: {fontSize: 13, color: '#333', textAlign: 'center', fontFamily: 'Cairo-Regular'},
  catNameSelected: {color: '#1a237e', fontWeight: 'bold'},
  checkmark: {position: 'absolute', top: 8, left: 8, color: '#1a237e', fontSize: 16},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
