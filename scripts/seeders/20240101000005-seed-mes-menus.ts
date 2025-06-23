import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const timestamp = new Date();
    
    // MES menu structure based on the provided JSON
    const menus = [
      // Level 1: Main Categories
      {
        id: '1',
        parent_id: null,
        title: '基础数据',
        href: '',
        icon: 'fa-solid fa-box-open',
        target: '_self',
        order_index: 1,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '2',
        parent_id: null,
        title: '生产管理',
        href: '',
        icon: 'fa-solid fa-industry',
        target: '_self',
        order_index: 2,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: 'A',
        parent_id: null,
        title: '质量管理',
        href: '',
        icon: 'fa-solid fa-medal',
        target: '_self',
        order_index: 3,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '5',
        parent_id: null,
        title: '报表管理',
        href: '',
        icon: 'fa-solid fa-chart-line',
        target: '_self',
        order_index: 4,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '7',
        parent_id: null,
        title: '系统管理',
        href: '',
        icon: 'fa-solid fa-cogs',
        target: '_self',
        order_index: 5,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      
      // Level 2: 基础数据 (1) children
      {
        id: '11',
        parent_id: '1',
        title: '产品定义',
        href: 'page/base_info/product/product_info.html',
        icon: 'fa-solid fa-circle-info',
        target: '_self',
        order_index: 1,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '12',
        parent_id: '1',
        title: '产品BOM',
        href: 'page/base_info/product/product_bom.html',
        icon: 'fa-solid fa-sitemap',
        target: '_self',
        order_index: 2,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '13',
        parent_id: '1',
        title: '工艺路线',
        href: 'page/base_info/product/product_router.html',
        icon: 'fa-solid fa-code-fork',
        target: '_self',
        order_index: 3,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '14',
        parent_id: '1',
        title: '工序定义',
        href: 'page/base_info/operation/operation_info.html',
        icon: 'fa-solid fa-tasks',
        target: '_self',
        order_index: 4,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '15',
        parent_id: '1',
        title: '设备定义',
        href: 'page/equipment/info/equipment_info.html',
        icon: 'fa-solid fa-tv',
        target: '_self',
        order_index: 5,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      
      // Level 2: 生产管理 (2) children
      {
        id: '21',
        parent_id: '2',
        title: '生产工单',
        href: '',
        icon: 'fa-solid fa-clipboard-list',
        target: '_self',
        order_index: 1,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '24',
        parent_id: '2',
        title: '生产流转卡',
        href: 'page/production/dispatch/production_sfc_dispatch.html',
        icon: 'fa-solid fa-sim-card',
        target: '_self',
        order_index: 2,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '25',
        parent_id: '2',
        title: '生产报工',
        href: 'page/production/report/workbench_sfc.html',
        icon: 'fa-solid fa-edit',
        target: '_self',
        order_index: 3,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '28',
        parent_id: '2',
        title: '生产看板',
        href: 'page/production/dashboard/production_dash.html',
        icon: 'fa-solid fa-desktop',
        target: '_self',
        order_index: 4,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      
      // Level 3: 生产工单 (21) children
      {
        id: '211',
        parent_id: '21',
        title: '工单管理',
        href: 'page/production/plan/production_plan.html',
        icon: 'fa-solid fa-clipboard-check',
        target: '_self',
        order_index: 1,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '212',
        parent_id: '21',
        title: '排产计划',
        href: 'page/production/schedule/production_schedule.html',
        icon: 'fa-solid fa-calendar-days',
        target: '_self',
        order_index: 2,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      
      // Level 2: 质量管理 (A) children
      {
        id: 'A1',
        parent_id: 'A',
        title: '缺陷管理',
        href: 'page/quality/defect/quality_defect.html',
        icon: 'fa-solid fa-bug',
        target: '_self',
        order_index: 1,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: 'A2',
        parent_id: 'A',
        title: '质检报告',
        href: 'page/quality/report/quality_report.html',
        icon: 'fa-solid fa-file-lines',
        target: '_self',
        order_index: 2,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      
      // Level 2: 报表管理 (5) children
      {
        id: '51',
        parent_id: '5',
        title: '生产报表',
        href: 'page/report/production/production_report.html',
        icon: 'fa-solid fa-file-export',
        target: '_self',
        order_index: 1,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '52',
        parent_id: '5',
        title: '质量报表',
        href: 'page/report/quality/quality_report.html',
        icon: 'fa-solid fa-file-medical',
        target: '_self',
        order_index: 2,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '53',
        parent_id: '5',
        title: '设备报表',
        href: 'page/report/equipment/equipment_report.html',
        icon: 'fa-solid fa-file-waveform',
        target: '_self',
        order_index: 3,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      
      // Level 2: 系统管理 (7) children
      {
        id: '71',
        parent_id: '7',
        title: '用户管理',
        href: 'page/system/user/user_management.html',
        icon: 'fa-solid fa-users',
        target: '_self',
        order_index: 1,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '72',
        parent_id: '7',
        title: '角色管理',
        href: 'page/system/role/role_management.html',
        icon: 'fa-solid fa-user-tag',
        target: '_self',
        order_index: 2,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '73',
        parent_id: '7',
        title: '权限管理',
        href: 'page/system/permission/permission_management.html',
        icon: 'fa-solid fa-user-shield',
        target: '_self',
        order_index: 3,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '74',
        parent_id: '7',
        title: '菜单管理',
        href: 'page/system/menu/menu_management.html',
        icon: 'fa-solid fa-bars',
        target: '_self',
        order_index: 4,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '75',
        parent_id: '7',
        title: '审计日志',
        href: 'page/system/audit/audit_log.html',
        icon: 'fa-solid fa-clock-rotate-left',
        target: '_self',
        order_index: 5,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp
      }
    ];

    await queryInterface.bulkInsert('menus', menus);

    // Now set up default menu permissions for roles
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles`
    );

    const roleMap = new Map((roles as any[]).map(r => [r.name, r.id]));
    const menuPermissions: any[] = [];

    // Super admin and system admin - full access to all menus
    ['super_admin', 'system_admin'].forEach(roleName => {
      const roleId = roleMap.get(roleName);
      if (roleId) {
        menus.forEach(menu => {
          menuPermissions.push({
            menu_id: menu.id,
            role_id: roleId,
            can_view: true,
            can_edit: true,
            can_delete: true,
            can_export: true
          });
        });
      }
    });

    // Production manager - access to production and report menus
    const prodManagerId = roleMap.get('production_manager');
    if (prodManagerId) {
      const prodMenuIds = ['1', '11', '12', '13', '14', '15', '2', '21', '211', '212', '24', '25', '28', '5', '51'];
      prodMenuIds.forEach(menuId => {
        menuPermissions.push({
          menu_id: menuId,
          role_id: prodManagerId,
          can_view: true,
          can_edit: true,
          can_delete: false,
          can_export: true
        });
      });
    }

    // Quality inspector - access to quality and some production menus
    const qualityId = roleMap.get('quality_inspector');
    if (qualityId) {
      const qualityMenuIds = ['A', 'A1', 'A2', '2', '25', '5', '52'];
      qualityMenuIds.forEach(menuId => {
        menuPermissions.push({
          menu_id: menuId,
          role_id: qualityId,
          can_view: true,
          can_edit: menuId.startsWith('A'),
          can_delete: false,
          can_export: true
        });
      });
    }

    // Operator - limited access
    const operatorId = roleMap.get('operator');
    if (operatorId) {
      const operatorMenuIds = ['2', '25', '28'];
      operatorMenuIds.forEach(menuId => {
        menuPermissions.push({
          menu_id: menuId,
          role_id: operatorId,
          can_view: true,
          can_edit: menuId === '25',
          can_delete: false,
          can_export: false
        });
      });
    }

    // Viewer - read-only access to most menus
    const viewerId = roleMap.get('viewer');
    if (viewerId) {
      const viewerMenuIds = ['1', '11', '12', '13', '14', '15', '2', '21', '211', '212', '24', '25', '28', 'A', 'A1', 'A2', '5', '51', '52', '53'];
      viewerMenuIds.forEach(menuId => {
        menuPermissions.push({
          menu_id: menuId,
          role_id: viewerId,
          can_view: true,
          can_edit: false,
          can_delete: false,
          can_export: false
        });
      });
    }

    if (menuPermissions.length > 0) {
      await queryInterface.bulkInsert('menu_permissions', menuPermissions);
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Delete menu permissions first
    await queryInterface.bulkDelete('menu_permissions', {}, {});
    // Then delete menus
    await queryInterface.bulkDelete('menus', {}, {});
  }
};