import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import Header from '../../components/Header';
import Table from '../../components/Table';
import FormModal from '../../components/FormModal';
import FormInput from '../../components/FormInput';
import FormSelect from '../../components/FormSelect';
import ConfirmationModal from '../../components/ConfirmationModal.js';
import { useAuth } from '../../auth/AuthContext';
import { colaboradorTableColumns, colaboradorInitialFormData, colaboradorFormSelectOptions } from '../../assets/AdministradorData.js';
import { getColaboradores, createColaborador, updateColaborador, deleteColaborador } from '../../services/colaboradores.js';

function Colaboradores() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoadingTable, setLoadingTable] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  const [formData, setFormData] = useState({ colaboradorInitialFormData });
  const [formErrors, setFormErrors] = useState({});
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfimAddModalOpen, setIsConfimAddModalOpen] = useState(false);
  const [isLoadingAdd, setIsLoadingAdd] = useState(false);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isFormEditing, setIsFormEditing] = useState(false);
  const [isConfimUpdateModalOpen, setIsConfimUpdateModalOpen] = useState(false);
  const [isDiscardUpdateModalOpen, setIsDiscardUpdateModalOpen] = useState(false);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  // Cargar lista de usuarios al cargar la página

  const loadUsers = useCallback(async () => {
    setLoadingTable(true);
    try {
      const response = await getColaboradores(token);
      console.log('(Colaboradores) Usuarios cargados: ', response);
      setUsers(response);
    } catch (error) {
      console.error('(Colaboradores) Error al cargar los usuarios: ', error);
    } finally {
      setLoadingTable(false);
      setIsLoadingContent(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (isLoadingContent) return <LoadingSpinner />;

  // Funciones auxiliares

  const convertISOToSimpleDate = (isoDateString) => {
    if (!isoDateString) return;
    const date = new Date(isoDateString);
    return date.toISOString().split('T')[0];
  };

  // Validar formulario de colaborador

  const validateForm = () => {
    const errors = {};
    if (!formData.tipo_identificacion || formData.tipo_identificacion === "Seleccione...") {
      errors.tipo_identificacion = "Tipo de documento es requerido";
    }
    if (!formData.numero_identificacion || !formData.numero_identificacion.trim()) {
      errors.numero_identificacion = "Número de documento es requerido";
    } else if (!/^\d{7,10}$/.test(formData.numero_identificacion.trim())) {
      errors.numero_identificacion = "Número de documento inválido, debe tener entre 7 y 10 dígitos";
    }
    if (!formData.nombre || !formData.nombre.trim()) {
      errors.nombre = "Nombres son requeridos";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombre.trim())) {
      errors.nombre = "Nombres inválidos, solo se permiten letras y espacios";
    }
    if (!formData.apellido || !formData.apellido.trim()) {
      errors.apellido = "Apellidos son requeridos";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.apellido.trim())) {
      errors.apellido = "Apellidos inválidos, solo se permiten letras y espacios";
    }
    if (!formData.fecha_nacimiento) {
      errors.fecha_nacimiento = "Fecha de nacimiento es requerida";
    } else if (new Date(formData.fecha_nacimiento) > new Date()) {
      errors.fecha_nacimiento = "Fecha de nacimiento no puede ser una fecha futura";
    }
    if (!formData.estado_civil || formData.estado_civil === "Seleccione...") {
      errors.estado_civil = "Estado civil es requerido";
    }
    if (!formData.sexo || formData.sexo === "Seleccione...") {
      errors.sexo = "Sexo es requerido";
    }
    if (!formData.direccion || !formData.direccion.trim()) {
      errors.direccion = "Dirección es requerida";
    }
    if (!formData.telefono || !formData.telefono.trim()) {
      errors.telefono = "Teléfono es requerido";
    } else if (!/^\d{7,10}$/.test(formData.telefono.trim())) {
      errors.telefono = "Teléfono inválido, debe tener entre 7 y 10 dígitos";
    }
    if (!formData.correo_electronico || !formData.correo_electronico.trim()) {
      errors.correo_electronico = "Correo Electrónico es requerido";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.correo_electronico.trim())) {
      errors.correo_electronico = "Correo Electrónico inválido";
    }
    if (!formData.salario || !formData.salario.trim()) {
      errors.salario = "Salario es requerido";
    } else if (!/^\d+$/.test(formData.salario.trim())) {
      errors.salario = "Salario inválido, solo se permiten números";
    }
    if (!formData.jerarquia || formData.jerarquia === "Seleccione...") {
      errors.jerarquia = "Jerarquía es requerida";
    }
    if (!formData.fecha_ingreso) {
      errors.fecha_ingreso = "Fecha de ingreso es requerida";
    } else if (new Date(formData.fecha_ingreso) > new Date()) {
      errors.fecha_ingreso = "Fecha de ingreso no puede ser una fecha futura";
    }
    if (formData.jerarquia === 'Médico' && (!formData.especialidad || formData.especialidad === "Seleccione...")) {
      errors.especialidad = "Especialidad es requerida";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Resetear formulario

  const resetForm = () => {
    setFormData(colaboradorInitialFormData);
    setFormErrors({});
  };

  // Modal de error inesperado

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setIsLoadingAdd(false);
    setIsLoadingUpdate(false);
    setIsLoadingDelete(false);
  };

  // Funciones para el modal añadir

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleAddFormChange = (name, value) => {
    setFormData((prevFormData) => {
      const updatedFormData = { ...prevFormData, [name]: value };
      if (name === 'jerarquia' && value !== 'Médico') {
        updatedFormData.especialidad = 'Seleccione...';
      }
      return updatedFormData;
    });
  };

  const createUser = async () => {
    if (validateForm()) {
      setIsLoadingAdd(true);
      try {
        const response = await createColaborador(token, formData);
        console.log('(Colaboradores) Usuario creado: ', response);
        setIsConfimAddModalOpen(true);
      } catch (error) {
        console.error('(Colaboradores) Hubo un error al crear el usuario: ', error);
        setIsErrorModalOpen(true);
      }
    } else {
      console.error('(Colaboradores) Datos inválidos.');
    }
  };

  const closeConfirmAddModal = () => {
    setIsConfimAddModalOpen(false);
    setIsAddModalOpen(false);
    setIsLoadingAdd(false);
    loadUsers();
  };

  // Funciones para el modal editar

  const openEditModal = (colaborador) => {
    setSelectedUser(colaborador);
    setFormData(colaborador);
    setIsUpdateModalOpen(true);
  };

  const closeEditModal = () => {
    if (isFormEditing) {
      setIsDiscardUpdateModalOpen(true);
    } else {
      setIsUpdateModalOpen(false);
      setSelectedUser(null);
      resetForm();
    }
  };

  const startEditing = () => {
    setIsFormEditing(true);
  };

  const handleEditFormChange = (name, value) => {
    if (isFormEditing) {
      setSelectedUser(prevState => {
        const newValues = { ...prevState, [name]: value };
        if (name === 'jerarquia' && value !== 'Médico') {
          newValues.especialidad = 'Seleccione...';
        }
        return newValues;
      });
      setFormData(prevData => {
        const newValues = { ...prevData, [name]: value };
        if (name === 'jerarquia' && value !== 'Médico') {
          newValues.especialidad = 'Seleccione...';
        }
        return newValues;
      });
    }
  };

  const updateUser = () => {
    if (validateForm()) {
      console.log('Datos válidos, editando colaborador...');
      setIsLoadingUpdate(true);
      setIsFormEditing(false);
      updateColaborador(selectedUser.numero_identificacion, formData)
        .then(response => {
          console.log("Colaborador editado: ", response.message);
          setIsConfimUpdateModalOpen(true);
        })
        .catch(error => {
          console.error('Hubo un error al editar el colaborador: ', error);
          setIsErrorModalOpen(true);
        });
    } else {
      console.log('Datos inválidos.');
    }
  };

  const closeConfirmUpdateModal = () => {
    setIsConfimUpdateModalOpen(false);
    setIsUpdateModalOpen(false);
    setSelectedUser(null);
    resetForm();
    setIsFormEditing(false);
    setIsLoadingUpdate(false);
    loadUsers();
  };

  const closeDiscardUpdateModal = () => {
    setIsDiscardUpdateModalOpen(false);
  };

  const closeAndDiscardUpdateModal = () => {
    setIsDiscardUpdateModalOpen(false);
    setIsUpdateModalOpen(false);
    setSelectedUser(null);
    resetForm();
    setIsFormEditing(false);
  };

  const OpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const deleteUser = () => {
    console.log('Eliminando colaborador...');
    setIsLoadingDelete(true);
    setIsDeleteModalOpen(false);
    deleteColaborador(selectedUser.numero_identificacion, formData)
      .then(response => {
        console.log("Colaborador eliminado: ", response.message);
        setIsConfirmDeleteModalOpen(true);
      })
      .catch(error => {
        console.error('Hubo un error al eliminar el colaborador:', error);
        setIsErrorModalOpen(true);
      });
  };

  const closeConfirmDeleteModal = () => {
    setIsConfirmDeleteModalOpen(false);
    setIsUpdateModalOpen(false);
    setSelectedUser(null);
    resetForm();
    setIsFormEditing(false);
    setIsLoadingDelete(false);
    loadUsers();
  }

  return (
    <div>
      <Header
        title="Gestión de colaboradores"
        subTitle="Información personal de los colaboradores del centro médico"
        addButton={
          <button className="btn btn-sm btn-primary" onClick={openAddModal}>
            <i className="fas fa-plus mr-3 text-white-50"></i> Añadir colaborador
          </button>
        }
      />

      {/* Tabla de colaboradores */}

      <Table label="Listado de colaboradores" columns={colaboradorTableColumns} data={users} loading={isLoadingTable}>
        {users.map((colaborador) => (
          <tr key={colaborador.numero_identificacion}>
            <td>{colaborador.numero_identificacion}</td>
            <td>{colaborador.nombre}</td>
            <td>{colaborador.apellido}</td>
            <td>{colaborador.jerarquia}</td>
            <td>{convertISOToSimpleDate(colaborador.fecha_nacimiento)}</td>
            <td>{colaborador.telefono}</td>
            <td className="d-flex justify-content-center align-items-center">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openEditModal(colaborador)}
                aria-label="Más opciones">
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </td>
          </tr>
        ))}
      </Table>

      {/* Modal de error inesperado */}

      <ConfirmationModal
        isOpen={isErrorModalOpen}
        title="Error insperado"
        message="La solicitud no puedo ser efectuada debido a un error inesperado, por favor intente de nuevo."
        footerButtons={
          <>
            <button type="button" className="btn btn-danger w-25" onClick={closeErrorModal}>Aceptar</button>
          </>
        }
      />

      {/* Modal añadir */}

      <FormModal
        isOpen={isAddModalOpen}
        title="Añadir colaborador"
        footerButtons={
          <>
            <button
              type="button"
              className="btn btn-success w-25"
              onClick={createUser}
              disabled={isLoadingAdd}
            > {isLoadingAdd ? "Cargando..." : "Añadir"}
            </button>
            <button
              type="button"
              className="btn btn-secondary w-25"
              onClick={closeAddModal}
              disabled={isLoadingAdd}
            > Cancelar
            </button>
          </>
        }
      >
        <form>
          <div className="form-row">
            <FormSelect
              label="Tipo de documento"
              id="tipo_identificacion"
              type="text"
              options={colaboradorFormSelectOptions.tipo_identificacion}
              value={formData.tipo_identificacion || ''}
              error={formErrors.tipo_identificacion}
              onChange={(e) => handleAddFormChange('tipo_identificacion', e.target.value)}
            />
            <FormInput
              label="Número de documento"
              id="numero_identificacion"
              type="number"
              value={formData.numero_identificacion || ''}
              error={formErrors.numero_identificacion}
              onChange={(e) => handleAddFormChange('numero_identificacion', e.target.value)}
            />
          </div>
          <div className="form-row">
            <FormInput
              label="Nombres"
              id="nombre"
              type="text"
              value={formData.nombre || ''}
              error={formErrors.nombre}
              onChange={(e) => handleAddFormChange('nombre', e.target.value)}
            />
            <FormInput
              label="Apellidos"
              id="apellido"
              type="text"
              value={formData.apellido || ''}
              error={formErrors.apellido}
              onChange={(e) => handleAddFormChange('apellido', e.target.value)}
            />
          </div>
          <div className="form-row">
            <FormInput
              label="Fecha de Nacimiento"
              id="fecha_nacimiento"
              type="date"
              value={formData.fecha_nacimiento || ''}
              error={formErrors.fecha_nacimiento}
              onChange={(e) => handleAddFormChange('fecha_nacimiento', e.target.value)}
            />
            <FormSelect
              label="Estado Civil"
              id="estado_civil"
              type="text"
              options={colaboradorFormSelectOptions.estado_civil}
              value={formData.estado_civil || ''}
              error={formErrors.estado_civil}
              onChange={(e) => handleAddFormChange('estado_civil', e.target.value)}
            />
          </div>
          <div className="form-row">
            <FormSelect
              label="Sexo"
              id="sexo"
              type="text"
              options={colaboradorFormSelectOptions.sexo}
              value={formData.sexo || ''}
              error={formErrors.sexo}
              onChange={(e) => handleAddFormChange('sexo', e.target.value)}
            />
            <FormInput
              label="Dirección"
              id="direccion"
              type="text"
              value={formData.direccion || ''}
              error={formErrors.direccion}
              onChange={(e) => handleAddFormChange('direccion', e.target.value)}
            />
          </div>
          <div className="form-row">
            <FormInput
              label="Teléfono"
              id="telefono"
              type="number"
              value={formData.telefono || ''}
              error={formErrors.telefono}
              onChange={(e) => handleAddFormChange('telefono', e.target.value)}
            />
            <FormInput
              label="Correo Electrónico"
              id="correo_electronico"
              type="email"
              value={formData.correo_electronico || ''}
              error={formErrors.correo_electronico}
              onChange={(e) => handleAddFormChange('correo_electronico', e.target.value)}
            />
          </div>
          <div className="form-row">
            <FormInput
              label="Salario"
              id="salario"
              type="number"
              value={formData.salario || ''}
              error={formErrors.salario}
              onChange={(e) => handleAddFormChange('salario', e.target.value)}
            />
            <FormSelect
              label="Jerarquía"
              id="jerarquia"
              type="text"
              options={colaboradorFormSelectOptions.jerarquia}
              value={formData.jerarquia || ''}
              error={formErrors.jerarquia}
              onChange={(e) => handleAddFormChange('jerarquia', e.target.value)}
            />
          </div>
          <div className="form-row">
            <FormInput
              label="Fecha de ingreso"
              id="fecha_ingreso"
              type="date"
              value={formData.fecha_ingreso || ''}
              error={formErrors.fecha_ingreso}
              onChange={(e) => handleAddFormChange('fecha_ingreso', e.target.value)}
            />
            <FormSelect
              label="Especialidad"
              id="especialidad"
              type="text"
              options={colaboradorFormSelectOptions.especialidad}
              value={formData.especialidad || ''}
              error={formErrors.especialidad}
              onChange={(e) => handleAddFormChange('especialidad', e.target.value)}
              isFormEditing={formData.jerarquia === 'Médico'}
            />
          </div>
        </form>
      </FormModal>

      {/* Modal añadido correctamente */}

      <ConfirmationModal
        isOpen={isConfimAddModalOpen}
        title="Colaborador añadido"
        message="El colaborador ha sido añadido correctamente."
        footerButtons={
          <>
            <button type="button" className="btn btn-success w-25" onClick={closeConfirmAddModal}>Aceptar</button>
          </>
        }
      />

      {/* Modal editar */}

      <FormModal
        isOpen={isUpdateModalOpen}
        title="Más información del colaborador"
        footerButtons={
          <>
            {isFormEditing || isLoadingUpdate ? (
              <button
                type="button"
                className="btn btn-success w-25"
                onClick={updateUser}
                disabled={isLoadingUpdate || isLoadingDelete}
              > {isLoadingUpdate ? "Cargando..." : "Guardar"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary w-25"
                  onClick={startEditing}
                  disabled={isLoadingUpdate || isLoadingDelete}
                > Editar
                </button>
                <button
                  type="button"
                  className="btn btn-danger w-25"
                  onClick={OpenDeleteModal}
                  disabled={isLoadingUpdate || isLoadingDelete}
                > {isLoadingDelete ? "Cargando..." : "Eliminar"}
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn-secondary w-25"
              onClick={closeEditModal}
              disabled={isLoadingUpdate || isLoadingDelete}
            > Cancelar
            </button>
          </>
        }
      >
        {selectedUser ? (
          <form>
            <div className="form-row">
              <FormSelect
                label="Tipo de documento"
                id="tipo_identificacion"
                type="text"
                options={colaboradorFormSelectOptions.tipo_identificacion}
                value={formData.tipo_identificacion  || ''}
                error={formErrors.tipo_identificacion}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('tipo_identificacion', e.target.value)}
              />
              <FormInput
                label="Número de documento"
                id="numero_identificacion"
                type="number"
                value={formData.numero_identificacion  || ''}
                error={formErrors.numero_identificacion}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('numero_identificacion', e.target.value)}
              />
            </div>
            <div className="form-row">
              <FormInput
                label="Nombres"
                id="nombre"
                type="text"
                value={formData.nombre  || ''}
                error={formErrors.nombre}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('nombre', e.target.value)}
              />
              <FormInput
                label="Apellidos"
                id="apellido"
                type="text"
                value={formData.apellido  || ''}
                error={formErrors.apellido}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('apellido', e.target.value)}
              />
            </div>
            <div className="form-row">
              <FormInput
                label="Fecha de Nacimiento"
                id="fecha_nacimiento"
                type="date"
                value={convertISOToSimpleDate(formData.fecha_nacimiento)  || ''}
                error={convertISOToSimpleDate(formErrors.fecha_nacimiento)}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('fecha_nacimiento', e.target.value)}
              />
              <FormSelect
                label="Estado Civil"
                id="estado_civil"
                options={colaboradorFormSelectOptions.estado_civil}
                value={formData.estado_civil  || ''}
                error={formErrors.estado_civil}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('estado_civil', e.target.value)}
              />
            </div>
            <div className="form-row">
              <FormSelect
                label="Sexo"
                id="sexo"
                options={colaboradorFormSelectOptions.sexo}
                value={formData.sexo  || ''}
                error={formErrors.sexo}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('sexo', e.target.value)}
              />
              <FormInput
                label="Dirección"
                id="direccion"
                type="text"
                value={formData.direccion  || ''}
                error={formErrors.direccion}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('direccion', e.target.value)}
              />
            </div>
            <div className="form-row">
              <FormInput
                label="Teléfono"
                id="telefono"
                type="number"
                value={formData.telefono  || ''}
                error={formErrors.telefono}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('telefono', e.target.value)}
              />
              <FormInput
                label="Correo Electrónico"
                id="correo_electronico"
                type="email"
                value={formData.correo_electronico  || ''}
                error={formErrors.correo_electronico}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('correo_electronico', e.target.value)}
              />
            </div>
            <div className="form-row">
              <FormInput
                label="Salario"
                id="salario"
                type="number"
                value={formData.salario  || ''}
                error={formErrors.salario}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('salario', e.target.value)}
              />
              <FormSelect
                label="Jerarquía"
                id="jerarquia"
                options={colaboradorFormSelectOptions.jerarquia}
                value={formData.jerarquia  || ''}
                error={formErrors.jerarquia}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('jerarquia', e.target.value)}
              />
            </div>
            <div className="form-row">
              <FormInput
                label="Fecha de ingreso"
                id="fecha_ingreso"
                type="date"
                value={convertISOToSimpleDate(formData.fecha_ingreso)  || ''}
                error={convertISOToSimpleDate(formErrors.fecha_ingreso)}
                isFormEditing={isFormEditing}
                onChange={(e) => handleEditFormChange('fecha_ingreso', e.target.value)}
              />
              <FormSelect
                label="Especialidad"
                id="especialidad"
                type="text"
                options={colaboradorFormSelectOptions.especialidad}
                value={formData.especialidad || ''}
                error={formErrors.especialidad}
                isFormEditing={isFormEditing && formData.jerarquia === 'Médico'}
                onChange={(e) => handleEditFormChange('especialidad', e.target.value)}
              />
            </div>
          </form>
        ) : (
          <p>Cargando...</p>
        )}

      </FormModal>

      {/* Modal actualizado correctamente */}

      <ConfirmationModal
        isOpen={isConfimUpdateModalOpen}
        title="Colaborador actualizado"
        message="El colaborador ha sido actualizado correctamente."
        footerButtons={
          <>
            <button type="button" className="btn btn-success w-25" onClick={closeConfirmUpdateModal}>Aceptar</button>
          </>
        }
      />

      {/* Modal descartar cambios */}

      <ConfirmationModal
        isOpen={isDiscardUpdateModalOpen}
        title="Descartar cambios"
        message="Tiene cambios sin guardar. ¿Está seguro de que quiere descartarlos?"
        footerButtons={
          <>
            <button type="button" className="btn btn-warning w-25" onClick={closeAndDiscardUpdateModal}>Descartar</button>
            <button type="button" className="btn btn-secondary w-25" onClick={closeDiscardUpdateModal}>Cancelar</button>
          </>
        }
      />

      {/* Modal confirmar eliminar */}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Eliminar colaborador"
        message="Esta acción no se puede deshacer. ¿Está seguro de que quiere eliminar este colaborador?"
        footerButtons={
          <>
            <button type="button" className="btn btn-danger w-25" onClick={deleteUser}>Eliminar</button>
            <button type="button" className="btn btn-secondary w-25" onClick={closeDeleteModal}>Cancelar</button>
          </>
        }
      />

      {/* Modal eliminado correctamente */}

      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        title="Colaborador eliminado"
        message="El colaborador ha sido eliminado correctamente."
        footerButtons={
          <>
            <button type="button" className="btn btn-success w-25" onClick={closeConfirmDeleteModal}>Aceptar</button>
          </>
        }
      />

    </div>
  );
}

export default Colaboradores;