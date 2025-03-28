from django.db import models

class ItemMaster(models.Model):
    TYPE_CHOICES = [
        ('Part', 'Part'),
        ('BOM', 'Bill of Materials'),
    ]
    sno = models.IntegerField(unique=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    product = models.CharField(max_length=100, blank=True, null=True)
    item_code = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    uom = models.CharField(max_length=10, blank=True, null=True)
    code = models.CharField(max_length=50, blank=True, null=True)
    u_oper_name = models.CharField(max_length=100, blank=True, null=True)
    assembly = models.BooleanField(default=False)
    burn_test = models.BooleanField(default=False)
    packing = models.BooleanField(default=False)
    image = models.ImageField(upload_to='images/', blank=True, null=True)
    weight = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    rev_reason = models.TextField(blank=True, null=True)
    rev_no = models.IntegerField(default=0)
    customer_complaint_info = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.item_code} - {self.description}"

class PCBItem(models.Model):
    """Model to represent PCB items with their cable descriptions"""
    CATEGORY_CHOICES = [
        ('YSB', 'YSB'),
        ('RSM', 'RSM'),
    ]
    
    item_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    cable_description = models.CharField(max_length=255)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)
    spindle_count = models.IntegerField(null=True, blank=True)
    pitch = models.CharField(max_length=30, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.item_code} - {self.name}"
    
    def save(self, *args, **kwargs):
        # Determine category based on item_code
        if self.item_code.startswith('YSB'):
            self.category = 'YSB'
        elif self.item_code.startswith('RSM'):
            self.category = 'RSM'
        super().save(*args, **kwargs)

class BOMComponent(models.Model):
    """Model to represent Bill of Materials component relationships"""
    parent_item = models.ForeignKey(ItemMaster, on_delete=models.CASCADE, related_name='bom_parents')
    child_item = models.ForeignKey(ItemMaster, on_delete=models.CASCADE, related_name='bom_children')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    case_no = models.CharField(max_length=50, blank=True, null=True)
    
    class Meta:
        unique_together = ('parent_item', 'child_item', 'case_no')
        ordering = ['case_no', 'child_item__item_code']
        verbose_name = "BOM Component"
        verbose_name_plural = "BOM Components"
    
    def __str__(self):
        return f"{self.parent_item.item_code} > {self.child_item.item_code} (Qty: {self.quantity})"

class AssemblyProcess(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    item = models.ForeignKey(ItemMaster, on_delete=models.CASCADE, related_name='assembly_processes')
    work_order = models.ForeignKey('work_order.WorkOrder', on_delete=models.CASCADE, related_name='assembly_processes')
    serial_number = models.CharField(max_length=100, unique=True)
    quantity_completed = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.CharField(max_length=100)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Assembly Process for {self.item.item_code} (SN: {self.serial_number})"

class AssemblyLog(models.Model):
    assembly_process = models.ForeignKey(AssemblyProcess, on_delete=models.CASCADE, related_name='logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=100)
    details = models.TextField()
    operator = models.CharField(max_length=100)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} at {self.timestamp}"

class ScannedPart(models.Model):
    assembly_process = models.ForeignKey(AssemblyProcess, on_delete=models.CASCADE, related_name='scanned_parts')
    part_code = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    scan_time = models.DateTimeField(auto_now_add=True)
    operator = models.CharField(max_length=100)
    replaced = models.BooleanField(default=False)
    replace_reason = models.TextField(blank=True, null=True)
    replaced_with = models.CharField(max_length=100, blank=True, null=True)
    replace_time = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.part_code} scanned at {self.scan_time}"