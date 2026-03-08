export const defaultServices = [
  'تغيير قطنه',
  'تغيير كارتدج',
  'ملي تانك ليكويد',
  'تغيير كويل',
  'تنضيف جهاز',
  'صيانة بسيطة',
  'تركيب بود جديد',
  'اختبار جهاز',
  'تغيير زجاج تانك',
  'فك وتنضيف تانك',
  'تغيير O-ring'
];

export const saleTypes = [
  { value: 'vape', labelAr: 'فيب', labelEn: 'Vape' },
  { value: 'pod', labelAr: 'بود', labelEn: 'Pod' },
  { value: 'liquid', labelAr: 'ليكويد', labelEn: 'Liquid' },
  { value: 'coil', labelAr: 'كويل', labelEn: 'Coil' },
  { value: 'cartridge', labelAr: 'كارتدج', labelEn: 'Cartridge' },
  { value: 'cotton', labelAr: 'قطن', labelEn: 'Cotton' },
  { value: 'battery', labelAr: 'بطارية', labelEn: 'Battery' },
  { value: 'charger', labelAr: 'شاحن', labelEn: 'Charger' },
  { value: 'accessory', labelAr: 'إكسسوار', labelEn: 'Accessory' },
  { value: 'tank', labelAr: 'تانك', labelEn: 'Tank' },
  { value: 'glass', labelAr: 'زجاج تانك', labelEn: 'Glass' }
] as const;

export const paymentMethods = ['Cash', 'Vodafone Cash', 'Transfer', 'Card', 'Other'];